import Image from 'next/image';
import { Twitter, Linkedin, Globe } from 'lucide-react';

// Define a type for the author data we expect
type Author = {
  profilePicture: string | null;
  firstName: string | null;
  lastName: string | null;
  bio: string | null;
  socialLinks: any; // Prisma's Json type
};

export function AuthorCard({ author }: { author: Author }) {
  const authorName = `${author.firstName || ''} ${author.lastName || ''}`.trim();
  const socials = author.socialLinks || {};

  return (
    <div className="p-6 rounded-lg border bg-slate-50">
      <div className="flex items-start gap-4">
        {author.profilePicture && (
          <Image
            src={author.profilePicture}
            alt={authorName}
            width={60}
            height={60}
            className="rounded-full"
          />
        )}
        <div>
          <p className="text-sm text-gray-500">Written by</p>
          <h3 className="text-lg font-bold text-gray-900">{authorName}</h3>
        </div>
      </div>
      {author.bio && (
        <p className="mt-4 text-sm text-gray-600">{author.bio}</p>
      )}
      <div className="mt-4 flex items-center gap-4">
        {socials.twitter && <a href={socials.twitter} target="_blank" rel="noopener noreferrer"><Twitter className="w-5 h-5 text-gray-500 hover:text-black" /></a>}
        {socials.linkedin && <a href={socials.linkedin} target="_blank" rel="noopener noreferrer"><Linkedin className="w-5 h-5 text-gray-500 hover:text-black" /></a>}
        {socials.website && <a href={socials.website} target="_blank" rel="noopener noreferrer"><Globe className="w-5 h-5 text-gray-500 hover:text-black" /></a>}
      </div>
    </div>
  );
}