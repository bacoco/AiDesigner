const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const os = require('node:os');

/**
 * MCP Security Manager - Handles secure credential storage and encryption
 */
class McpSecurity {
  constructor() {
    this.platform = os.platform();
    this.algorithm = 'aes-256-gcm';
    this.keyLength = 32; // 256 bits
    this.secureDir = path.join(os.homedir(), '.bmad-invisible', 'secure');
    this.vaultFile = path.join(this.secureDir, 'vault.enc');
    this.masterKeyFile = path.join(this.secureDir, '.master.key');
  }

  /**
   * Initialize secure storage
   */
  async initialize() {
    if (!fs.existsSync(this.secureDir)) {
      fs.mkdirSync(this.secureDir, { recursive: true, mode: 0o700 });
    }

    // Generate master key if it doesn't exist
    if (!fs.existsSync(this.masterKeyFile)) {
      const masterKey = crypto.randomBytes(this.keyLength);
      fs.writeFileSync(this.masterKeyFile, masterKey, { mode: 0o600 });
    }
  }

  /**
   * Get master encryption key
   */
  getMasterKey() {
    if (!fs.existsSync(this.masterKeyFile)) {
      throw new Error('Master key not found. Run initialize() first.');
    }
    return fs.readFileSync(this.masterKeyFile);
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  encrypt(data) {
    const key = this.getMasterKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    const encrypted = Buffer.concat([cipher.update(JSON.stringify(data), 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      encrypted: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  decrypt(encryptedData) {
    const key = this.getMasterKey();
    const iv = Buffer.from(encryptedData.iv, 'base64');
    const authTag = Buffer.from(encryptedData.authTag, 'base64');
    const encrypted = Buffer.from(encryptedData.encrypted, 'base64');

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return JSON.parse(decrypted.toString('utf8'));
  }

  /**
   * Store credential in system keychain
   */
  async storeInKeychain(service, account, password) {
    try {
      switch (this.platform) {
        case 'darwin': {
          // macOS Keychain
          execSync(
            `security add-generic-password -a "${account}" -s "${service}" -w "${password}" -U`,
            { stdio: 'ignore' },
          );
          return true;
        }
        case 'win32': {
          // Windows Credential Manager (using cmdkey)
          execSync(`cmdkey /generic:"${service}" /user:"${account}" /pass:"${password}"`, {
            stdio: 'ignore',
          });
          return true;
        }
        case 'linux': {
          // Linux Secret Service (using secret-tool if available)
          try {
            execSync(
              `secret-tool store --label="${service}" service "${service}" account "${account}"`,
              { input: password, stdio: 'pipe' },
            );
            return true;
          } catch {
            // Fallback to encrypted local storage
            return false;
          }

          break;
        }
        // No default
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Retrieve credential from system keychain
   */
  async retrieveFromKeychain(service, account) {
    try {
      switch (this.platform) {
        case 'darwin': {
          // macOS Keychain
          const password = execSync(
            `security find-generic-password -a "${account}" -s "${service}" -w`,
            { encoding: 'utf8' },
          ).trim();
          return password;
        }
        case 'win32': {
          // Windows - more complex, would need powershell
          return null;
        }
        case 'linux': {
          try {
            const password = execSync(
              `secret-tool lookup service "${service}" account "${account}"`,
              { encoding: 'utf8' },
            ).trim();
            return password;
          } catch {
            return null;
          }

          break;
        }
        // No default
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Delete credential from keychain
   */
  async deleteFromKeychain(service, account) {
    try {
      switch (this.platform) {
        case 'darwin': {
          execSync(`security delete-generic-password -a "${account}" -s "${service}"`, {
            stdio: 'ignore',
          });
          return true;
        }
        case 'win32': {
          execSync(`cmdkey /delete:"${service}"`, { stdio: 'ignore' });
          return true;
        }
        case 'linux': {
          execSync(`secret-tool clear service "${service}" account "${account}"`, {
            stdio: 'ignore',
          });
          return true;
        }
        // No default
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Load secure vault
   */
  loadVault() {
    if (!fs.existsSync(this.vaultFile)) {
      return {};
    }

    try {
      const encryptedData = JSON.parse(fs.readFileSync(this.vaultFile, 'utf8'));
      return this.decrypt(encryptedData);
    } catch {
      return {};
    }
  }

  /**
   * Save secure vault
   */
  saveVault(vault) {
    const encrypted = this.encrypt(vault);
    fs.writeFileSync(this.vaultFile, JSON.stringify(encrypted), { mode: 0o600 });
  }

  /**
   * Store credential securely (keychain first, then encrypted vault)
   */
  async storeCredential(key, value, profile = 'default') {
    const service = `bmad-mcp-${profile}`;
    const account = key;

    // Try keychain first
    const keychainSuccess = await this.storeInKeychain(service, account, value);

    if (keychainSuccess) {
      // Store metadata that credential is in keychain
      const vault = this.loadVault();
      vault[profile] = vault[profile] || {};
      vault[profile][key] = {
        type: 'keychain',
        service,
        account,
        stored: new Date().toISOString(),
      };
      this.saveVault(vault);
      return { method: 'keychain', success: true };
    } else {
      // Fallback to encrypted vault
      const vault = this.loadVault();
      vault[profile] = vault[profile] || {};
      vault[profile][key] = {
        type: 'encrypted',
        value,
        stored: new Date().toISOString(),
      };
      this.saveVault(vault);
      return { method: 'encrypted', success: true };
    }
  }

  /**
   * Retrieve credential securely
   */
  async retrieveCredential(key, profile = 'default') {
    const vault = this.loadVault();

    if (!vault[profile] || !vault[profile][key]) {
      return null;
    }

    const credential = vault[profile][key];

    if (credential.type === 'keychain') {
      const value = await this.retrieveFromKeychain(credential.service, credential.account);
      return value;
    } else if (credential.type === 'encrypted') {
      return credential.value;
    }

    return null;
  }

  /**
   * Delete credential
   */
  async deleteCredential(key, profile = 'default') {
    const vault = this.loadVault();

    if (!vault[profile] || !vault[profile][key]) {
      return false;
    }

    const credential = vault[profile][key];

    if (credential.type === 'keychain') {
      await this.deleteFromKeychain(credential.service, credential.account);
    }

    delete vault[profile][key];
    this.saveVault(vault);
    return true;
  }

  /**
   * List all stored credentials (metadata only)
   */
  listCredentials(profile = 'default') {
    const vault = this.loadVault();
    if (!vault[profile]) {
      return [];
    }

    return Object.entries(vault[profile]).map(([key, data]) => ({
      key,
      type: data.type,
      stored: data.stored,
    }));
  }

  /**
   * Rotate encryption keys (re-encrypt all data with new master key)
   */
  async rotateKeys() {
    // Decrypt all data with old key
    const vault = this.loadVault();

    // Generate new master key
    const newMasterKey = crypto.randomBytes(this.keyLength);
    const backupKeyFile = `${this.masterKeyFile}.backup`;
    fs.copyFileSync(this.masterKeyFile, backupKeyFile);
    fs.writeFileSync(this.masterKeyFile, newMasterKey, { mode: 0o600 });

    try {
      // Re-encrypt vault with new key
      this.saveVault(vault);

      // Clean up backup
      fs.unlinkSync(backupKeyFile);
      return true;
    } catch (error) {
      // Restore old key on failure
      fs.copyFileSync(backupKeyFile, this.masterKeyFile);
      fs.unlinkSync(backupKeyFile);
      throw error;
    }
  }

  /**
   * Audit configuration for security issues
   */
  auditConfig(config) {
    const issues = [];
    const warnings = [];

    // Check for plain-text credentials in config
    const checkForSecrets = (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        const currentPath = path ? `${path}.${key}` : key;

        if (typeof value === 'string') {
          // Check for common secret patterns
          if (
            key.toLowerCase().includes('key') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('password')
          ) {
            issues.push({
              path: currentPath,
              type: 'plain-text-secret',
              severity: 'high',
              message: `Potential secret stored in plain text: ${currentPath}`,
            });
          }

          // Check for API key patterns
          if (
            /^sk-[a-zA-Z0-9]{32,}/.test(value) || // OpenAI style
            /^[A-Za-z0-9_-]{32,}$/.test(value) || // Generic API key
            /^AIza[0-9A-Za-z_-]{35}$/.test(value)
          ) {
            // Google API key
            issues.push({
              path: currentPath,
              type: 'api-key-detected',
              severity: 'critical',
              message: `API key detected in plain text: ${currentPath}`,
            });
          }
        } else if (typeof value === 'object' && value !== null) {
          checkForSecrets(value, currentPath);
        }
      }
    };

    checkForSecrets(config);

    // Check file permissions
    if (this.platform !== 'win32') {
      try {
        const stats = fs.statSync(this.masterKeyFile);
        const mode = stats.mode & 0o777;
        if (mode !== 0o600) {
          warnings.push({
            type: 'file-permissions',
            severity: 'medium',
            message: `Master key file has insecure permissions: ${mode.toString(8)}`,
          });
        }
      } catch {
        // File doesn't exist yet
      }
    }

    return {
      issues,
      warnings,
      secure: issues.length === 0,
      summary: `Found ${issues.length} issue(s) and ${warnings.length} warning(s)`,
    };
  }

  /**
   * Migrate plain-text config to secure storage
   */
  async migrateToSecure(config, profile = 'default') {
    const migrated = { ...config };
    const migratedKeys = [];

    const migrateSecrets = async (obj, path = '') => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
          if (
            key.toLowerCase().includes('key') ||
            key.toLowerCase().includes('token') ||
            key.toLowerCase().includes('secret') ||
            key.toLowerCase().includes('password')
          ) {
            // Store in secure vault
            await this.storeCredential(key, value, profile);
            migratedKeys.push(key);

            // Replace with reference
            obj[key] = `{{vault:${key}}}`;
          }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          await migrateSecrets(value, `${path}.${key}`);
        }
      }
    };

    await migrateSecrets(migrated);

    return {
      config: migrated,
      migratedKeys,
      count: migratedKeys.length,
    };
  }

  /**
   * Resolve vault references in config
   */
  async resolveVaultReferences(config, profile = 'default') {
    const resolved = structuredClone(config);

    const resolveReferences = async (obj) => {
      for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string' && value.startsWith('{{vault:') && value.endsWith('}}')) {
          const credKey = value.slice(8, -2);
          const credValue = await this.retrieveCredential(credKey, profile);
          if (credValue) {
            obj[key] = credValue;
          }
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          await resolveReferences(value);
        }
      }
    };

    await resolveReferences(resolved);
    return resolved;
  }
}

module.exports = McpSecurity;
