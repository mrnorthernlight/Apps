/**
 * Signal Protocol implementation for FamBase E2EE
 * This is a simplified implementation for demonstration.
 * In production, use a fully audited Signal Protocol library.
 */

import * as nacl from 'tweetnacl'
import { encodeBase64, decodeBase64 } from 'tweetnacl-util'
import { DeviceBundle, EncryptedMessage } from '@fambase/shared'

export interface KeyPair {
  publicKey: Uint8Array
  secretKey: Uint8Array
}

export interface PreKey {
  keyId: number
  keyPair: KeyPair
}

export interface SignedPreKey extends PreKey {
  signature: Uint8Array
}

export interface IdentityKeyPair {
  publicKey: Uint8Array
  privateKey: Uint8Array
}

export interface SessionState {
  rootKey: Uint8Array
  chainKey: Uint8Array
  sendingChainKey: Uint8Array
  receivingChainKey: Uint8Array
  messageKeys: Map<number, Uint8Array>
}

export class SignalProtocol {
  private identityKeyPair: IdentityKeyPair
  private preKeys: Map<number, PreKey> = new Map()
  private signedPreKey: SignedPreKey
  private sessions: Map<string, SessionState> = new Map()

  constructor() {
    // Generate identity key pair
    const identityKeys = nacl.box.keyPair()
    this.identityKeyPair = {
      publicKey: identityKeys.publicKey,
      privateKey: identityKeys.secretKey
    }

    // Generate signed pre-key
    const signedPreKeyPair = nacl.box.keyPair()
    const signature = nacl.sign.detached(
      signedPreKeyPair.publicKey,
      this.identityKeyPair.privateKey
    )
    
    this.signedPreKey = {
      keyId: 1,
      keyPair: {
        publicKey: signedPreKeyPair.publicKey,
        secretKey: signedPreKeyPair.secretKey
      },
      signature
    }

    // Generate one-time pre-keys
    this.generatePreKeys(100)
  }

  private generatePreKeys(count: number): void {
    for (let i = 0; i < count; i++) {
      const keyPair = nacl.box.keyPair()
      this.preKeys.set(i, {
        keyId: i,
        keyPair: {
          publicKey: keyPair.publicKey,
          secretKey: keyPair.secretKey
        }
      })
    }
  }

  public getDeviceBundle(): DeviceBundle {
    const preKeys = Array.from(this.preKeys.entries()).slice(0, 10).map(([keyId, preKey]) => ({
      keyId,
      publicKey: encodeBase64(preKey.keyPair.publicKey)
    }))

    return {
      identityKey: encodeBase64(this.identityKeyPair.publicKey),
      preKeys,
      signedPreKey: {
        keyId: this.signedPreKey.keyId,
        publicKey: encodeBase64(this.signedPreKey.keyPair.publicKey),
        signature: encodeBase64(this.signedPreKey.signature)
      }
    }
  }

  public async initializeSession(
    recipientId: string,
    deviceBundle: DeviceBundle
  ): Promise<void> {
    // Simplified session initialization
    // In a real implementation, this would follow the Signal Protocol X3DH key agreement
    
    const identityKey = decodeBase64(deviceBundle.identityKey)
    const signedPreKey = decodeBase64(deviceBundle.signedPreKey.publicKey)
    const oneTimePreKey = deviceBundle.preKeys.length > 0 
      ? decodeBase64(deviceBundle.preKeys[0].publicKey)
      : null

    // Derive shared secret using ECDH
    const sharedSecret1 = nacl.box.before(identityKey, this.identityKeyPair.privateKey)
    const sharedSecret2 = nacl.box.before(signedPreKey, this.identityKeyPair.privateKey)
    
    let combinedSecret = new Uint8Array(sharedSecret1.length + sharedSecret2.length)
    combinedSecret.set(sharedSecret1)
    combinedSecret.set(sharedSecret2, sharedSecret1.length)

    if (oneTimePreKey) {
      const sharedSecret3 = nacl.box.before(oneTimePreKey, this.identityKeyPair.privateKey)
      const newCombined = new Uint8Array(combinedSecret.length + sharedSecret3.length)
      newCombined.set(combinedSecret)
      newCombined.set(sharedSecret3, combinedSecret.length)
      combinedSecret = newCombined
    }

    // Derive root key and chain key from shared secret
    const rootKey = nacl.hash(combinedSecret).slice(0, 32)
    const chainKey = nacl.hash(combinedSecret).slice(32, 64)

    this.sessions.set(recipientId, {
      rootKey,
      chainKey,
      sendingChainKey: chainKey,
      receivingChainKey: chainKey,
      messageKeys: new Map()
    })
  }

  public async encryptMessage(
    recipientId: string,
    plaintext: string
  ): Promise<EncryptedMessage> {
    const session = this.sessions.get(recipientId)
    if (!session) {
      throw new Error('No session found for recipient')
    }

    // Generate ephemeral key pair for this message
    const ephemeralKeyPair = nacl.box.keyPair()
    
    // Derive message key from chain key
    const messageKey = nacl.hash(session.sendingChainKey).slice(0, 32)
    
    // Update chain key
    session.sendingChainKey = nacl.hash(session.sendingChainKey)

    // Encrypt the message
    const nonce = nacl.randomBytes(24)
    const plaintextBytes = new TextEncoder().encode(plaintext)
    const ciphertext = nacl.secretbox(plaintextBytes, nonce, messageKey)

    // Create MAC
    const macData = new Uint8Array(ciphertext.length + ephemeralKeyPair.publicKey.length)
    macData.set(ciphertext)
    macData.set(ephemeralKeyPair.publicKey, ciphertext.length)
    const mac = nacl.hash(macData).slice(0, 16)

    return {
      ciphertext: new Uint8Array([...nonce, ...ciphertext]),
      ephemeralKey: encodeBase64(ephemeralKeyPair.publicKey),
      mac: encodeBase64(mac)
    }
  }

  public async decryptMessage(
    senderId: string,
    encryptedMessage: EncryptedMessage
  ): Promise<string> {
    const session = this.sessions.get(senderId)
    if (!session) {
      throw new Error('No session found for sender')
    }

    // Extract nonce and ciphertext
    const nonce = encryptedMessage.ciphertext.slice(0, 24)
    const ciphertext = encryptedMessage.ciphertext.slice(24)

    // Derive message key from chain key
    const messageKey = nacl.hash(session.receivingChainKey).slice(0, 32)
    
    // Update chain key
    session.receivingChainKey = nacl.hash(session.receivingChainKey)

    // Decrypt the message
    const decrypted = nacl.secretbox.open(ciphertext, nonce, messageKey)
    if (!decrypted) {
      throw new Error('Failed to decrypt message')
    }

    return new TextDecoder().decode(decrypted)
  }

  public exportKeys(): string {
    // Export keys for backup (encrypted with user passphrase in real implementation)
    const keyData = {
      identityKeyPair: {
        publicKey: encodeBase64(this.identityKeyPair.publicKey),
        privateKey: encodeBase64(this.identityKeyPair.privateKey)
      },
      signedPreKey: {
        keyId: this.signedPreKey.keyId,
        publicKey: encodeBase64(this.signedPreKey.keyPair.publicKey),
        secretKey: encodeBase64(this.signedPreKey.keyPair.secretKey),
        signature: encodeBase64(this.signedPreKey.signature)
      },
      preKeys: Array.from(this.preKeys.entries()).map(([keyId, preKey]) => ({
        keyId,
        publicKey: encodeBase64(preKey.keyPair.publicKey),
        secretKey: encodeBase64(preKey.keyPair.secretKey)
      }))
    }

    return JSON.stringify(keyData)
  }

  public importKeys(keyDataString: string): void {
    // Import keys from backup
    const keyData = JSON.parse(keyDataString)
    
    this.identityKeyPair = {
      publicKey: decodeBase64(keyData.identityKeyPair.publicKey),
      privateKey: decodeBase64(keyData.identityKeyPair.privateKey)
    }

    this.signedPreKey = {
      keyId: keyData.signedPreKey.keyId,
      keyPair: {
        publicKey: decodeBase64(keyData.signedPreKey.publicKey),
        secretKey: decodeBase64(keyData.signedPreKey.secretKey)
      },
      signature: decodeBase64(keyData.signedPreKey.signature)
    }

    this.preKeys.clear()
    keyData.preKeys.forEach((preKey: any) => {
      this.preKeys.set(preKey.keyId, {
        keyId: preKey.keyId,
        keyPair: {
          publicKey: decodeBase64(preKey.publicKey),
          secretKey: decodeBase64(preKey.secretKey)
        }
      })
    })
  }
}

// Group encryption using sender keys
export class GroupEncryption {
  private senderKeys: Map<string, Uint8Array> = new Map()

  public generateSenderKey(groupId: string): Uint8Array {
    const senderKey = nacl.randomBytes(32)
    this.senderKeys.set(groupId, senderKey)
    return senderKey
  }

  public setSenderKey(groupId: string, senderKey: Uint8Array): void {
    this.senderKeys.set(groupId, senderKey)
  }

  public encryptForGroup(groupId: string, plaintext: string): Uint8Array {
    const senderKey = this.senderKeys.get(groupId)
    if (!senderKey) {
      throw new Error('No sender key found for group')
    }

    const nonce = nacl.randomBytes(24)
    const plaintextBytes = new TextEncoder().encode(plaintext)
    const ciphertext = nacl.secretbox(plaintextBytes, nonce, senderKey)

    // Combine nonce and ciphertext
    const result = new Uint8Array(nonce.length + ciphertext.length)
    result.set(nonce)
    result.set(ciphertext, nonce.length)

    return result
  }

  public decryptFromGroup(groupId: string, ciphertext: Uint8Array): string {
    const senderKey = this.senderKeys.get(groupId)
    if (!senderKey) {
      throw new Error('No sender key found for group')
    }

    const nonce = ciphertext.slice(0, 24)
    const encryptedData = ciphertext.slice(24)

    const decrypted = nacl.secretbox.open(encryptedData, nonce, senderKey)
    if (!decrypted) {
      throw new Error('Failed to decrypt group message')
    }

    return new TextDecoder().decode(decrypted)
  }
}

// Media encryption utilities
export class MediaEncryption {
  public static async encryptFile(file: ArrayBuffer): Promise<{
    encryptedData: Uint8Array
    key: Uint8Array
    iv: Uint8Array
  }> {
    const key = nacl.randomBytes(32)
    const iv = nacl.randomBytes(24)
    const fileData = new Uint8Array(file)
    
    const encryptedData = nacl.secretbox(fileData, iv, key)

    return {
      encryptedData,
      key,
      iv
    }
  }

  public static async decryptFile(
    encryptedData: Uint8Array,
    key: Uint8Array,
    iv: Uint8Array
  ): Promise<ArrayBuffer> {
    const decrypted = nacl.secretbox.open(encryptedData, iv, key)
    if (!decrypted) {
      throw new Error('Failed to decrypt file')
    }

    return decrypted.buffer
  }
}

