# journal/utils.py
import os
from Crypto.Cipher import AES


def encrypt(plaintext, key):
    iv = os.urandom(12)
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    ciphertext, auth_tag = cipher.encrypt_and_digest(plaintext.encode('utf-8'))
    return ciphertext + auth_tag, iv


def decrypt(ciphertext_with_tag, iv, key):
    ciphertext = ciphertext_with_tag[:-16]
    auth_tag = ciphertext_with_tag[-16:]
    cipher = AES.new(key, AES.MODE_GCM, nonce=iv)
    return cipher.decrypt_and_verify(ciphertext, auth_tag).decode('utf-8')


def encrypt_note(title, content, key):
    title_encrypted, title_iv = encrypt(title, key)
    content_encrypted, content_iv = encrypt(content, key)
    return {
        'title_encrypted': title_encrypted,
        'title_iv': title_iv,
        'content_encrypted': content_encrypted,
        'content_iv': content_iv,
    }


def decrypt_note(note, key):
    # bytes() conversion needed because Django returns
    # BinaryField as memoryview, not bytes
    title = decrypt(bytes(note.title_encrypted), bytes(note.title_iv), key)
    content = decrypt(bytes(note.content_encrypted), bytes(note.content_iv), key)
    return title, content