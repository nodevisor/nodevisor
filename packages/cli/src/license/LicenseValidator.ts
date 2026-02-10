import * as fs from 'node:fs';
import * as path from 'node:path';
import { expandHomeDir } from '@nodevisor/shell';

export interface License {
  type: 'free' | 'pro' | 'enterprise';
  key?: string;
  email?: string;
  expiresAt?: Date;
  maxApps?: number;
}

export class LicenseValidator {
  private static readonly LICENSE_FILE = '~/.nodevisor/license.json';
  private static readonly FREE_TIER_LIMIT = 3;

  static async validateLicense(): Promise<License> {
    const licensePath = expandHomeDir(this.LICENSE_FILE);
    
    if (!fs.existsSync(licensePath)) {
      return this.createFreeLicense();
    }

    try {
      const licenseData = JSON.parse(fs.readFileSync(licensePath, 'utf-8'));
      return this.validateLicenseData(licenseData);
    } catch (error) {
      console.warn('Invalid license file, falling back to free tier');
      return this.createFreeLicense();
    }
  }

  static async setLicense(key: string, email: string): Promise<void> {
    const licensePath = expandHomeDir(this.LICENSE_FILE);
    const licenseDir = path.dirname(licensePath);

    if (!fs.existsSync(licenseDir)) {
      fs.mkdirSync(licenseDir, { recursive: true });
    }

    // In a real implementation, this would validate the license key with a server
    const license: License = {
      type: 'pro',
      key,
      email,
      maxApps: 50
    };

    fs.writeFileSync(licensePath, JSON.stringify(license, null, 2));
    console.log('License activated successfully');
  }

  static async removeLicense(): Promise<void> {
    const licensePath = expandHomeDir(this.LICENSE_FILE);
    
    if (fs.existsSync(licensePath)) {
      fs.unlinkSync(licensePath);
      console.log('License removed, switching to free tier');
    }
  }

  static async checkAppLimit(currentAppCount: number): Promise<boolean> {
    const license = await this.validateLicense();
    
    if (license.type === 'free' && currentAppCount >= this.FREE_TIER_LIMIT) {
      console.error(`\n❌ Free tier limited to ${this.FREE_TIER_LIMIT} apps. You have ${currentAppCount} apps.`);
      console.error('Upgrade to Pro for unlimited apps: https://nodevisor.io/pricing');
      console.error('Or use: nodevisor license set <key> <email>');
      return false;
    }

    if (license.maxApps && currentAppCount >= license.maxApps) {
      console.error(`\n❌ License allows max ${license.maxApps} apps. You have ${currentAppCount} apps.`);
      console.error('Contact support: sales@nodevisor.io');
      return false;
    }

    return true;
  }

  private static createFreeLicense(): License {
    return {
      type: 'free',
      maxApps: this.FREE_TIER_LIMIT
    };
  }

  private static validateLicenseData(data: any): License {
    if (data.type === 'free') {
      return this.createFreeLicense();
    }

    if (data.type === 'pro' || data.type === 'enterprise') {
      if (!data.key || !data.email) {
        throw new Error('Invalid license format');
      }

      // Check expiration
      if (data.expiresAt && new Date(data.expiresAt) < new Date()) {
        throw new Error('License expired');
      }

      return {
        type: data.type,
        key: data.key,
        email: data.email,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        maxApps: data.maxApps || (data.type === 'pro' ? 50 : 999)
      };
    }

    throw new Error('Unknown license type');
  }
}