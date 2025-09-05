'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Twitter, 
  Linkedin, 
  Github, 
  Globe, 
  Instagram, 
  Facebook,
  Link as LinkIcon
} from 'lucide-react';

interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
}

export type { SocialLinks };

interface SocialLinksFormProps {
  socialLinks: SocialLinks;
  onChange: (socialLinks: SocialLinks) => void;
  disabled?: boolean;
}

const socialPlatforms = [
  {
    key: 'twitter' as keyof SocialLinks,
    label: 'Twitter',
    icon: Twitter,
    placeholder: 'https://twitter.com/username',
    color: 'text-blue-400'
  },
  {
    key: 'linkedin' as keyof SocialLinks,
    label: 'LinkedIn',
    icon: Linkedin,
    placeholder: 'https://linkedin.com/in/username',
    color: 'text-blue-600'
  },
  {
    key: 'github' as keyof SocialLinks,
    label: 'GitHub',
    icon: Github,
    placeholder: 'https://github.com/username',
    color: 'text-gray-800'
  },
  {
    key: 'website' as keyof SocialLinks,
    label: 'Website',
    icon: Globe,
    placeholder: 'https://yourwebsite.com',
    color: 'text-green-600'
  },
  {
    key: 'instagram' as keyof SocialLinks,
    label: 'Instagram',
    icon: Instagram,
    placeholder: 'https://instagram.com/username',
    color: 'text-pink-600'
  },
  {
    key: 'facebook' as keyof SocialLinks,
    label: 'Facebook',
    icon: Facebook,
    placeholder: 'https://facebook.com/username',
    color: 'text-blue-700'
  },
];

export function SocialLinksForm({ socialLinks, onChange, disabled = false }: SocialLinksFormProps) {
  const handleChange = (platform: keyof SocialLinks, value: string) => {
    onChange({
      ...socialLinks,
      [platform]: value.trim()
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <LinkIcon className="h-4 w-4" />
          Social Media Links
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialPlatforms.map(({ key, label, icon: Icon, placeholder, color }) => (
            <div key={key} className="space-y-2">
              <Label htmlFor={key} className="flex items-center gap-2 text-sm font-medium">
                <Icon className={`h-4 w-4 ${color}`} />
                {label}
              </Label>
              <Input
                id={key}
                type="url"
                placeholder={placeholder}
                value={socialLinks[key] || ''}
                onChange={(e) => handleChange(key, e.target.value)}
                disabled={disabled}
                className="text-sm"
              />
            </div>
          ))}
        </div>
        
        {/* Preview Active Links */}
        {Object.entries(socialLinks).some(([_, value]) => value && value.trim()) && (
          <div className="pt-4 border-t">
            <Label className="text-sm font-medium mb-2 block">Active Social Links:</Label>
            <div className="flex flex-wrap gap-2">
              {socialPlatforms.map(({ key, label, icon: Icon, color }) => {
                const value = socialLinks[key];
                if (!value || !value.trim()) return null;
                
                return (
                  <a
                    key={key}
                    href={value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-muted hover:bg-muted/80 transition-colors ${color}`}
                  >
                    <Icon className="h-3 w-3" />
                    {label}
                  </a>
                );
              })}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
