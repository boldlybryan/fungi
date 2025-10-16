// Paths that cannot be modified by prototypes (core functionality)
export const PROTECTED_PATHS = [
  '/app/api/prototype/',
  '/app/api/auth/',
  '/app/dashboard/',
  '/app/(auth)/',
  '/app/prototype/',
  '/lib/github.ts',
  '/lib/neon.ts',
  '/lib/vercel.ts',
  '/lib/v0.ts',
  '/lib/auth.ts',
  '/lib/email.ts',
  '/lib/db.ts',
  '/lib/protected-paths.ts',
  '/middleware.ts',
  '/prisma/schema.prisma', // PoC's own database schema
  '/.env',
  '/.env.local',
  '/package.json',
  '/next.config',
  '/tsconfig.json',
];

// Paths that are safe to modify (example content)
export const MODIFIABLE_PATHS = [
  '/app/page.tsx',
  '/app/examples/',
  '/components/ui/',
  '/components/examples/',
  '/public/',
  '/app/globals.css',
];

export function isProtectedPath(filePath: string): boolean {
  // Normalize the path
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  
  // Check if path matches any protected pattern
  for (const protectedPath of PROTECTED_PATHS) {
    if (normalizedPath.startsWith(protectedPath)) {
      return true;
    }
  }
  
  return false;
}

export function isModifiablePath(filePath: string): boolean {
  const normalizedPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  
  // Check if path matches any modifiable pattern
  for (const modifiablePath of MODIFIABLE_PATHS) {
    if (normalizedPath.startsWith(modifiablePath)) {
      return !isProtectedPath(normalizedPath);
    }
  }
  
  return false;
}

export function filterModifiablePaths(files: Array<{ path: string; content: string }>) {
  return files.filter(file => isModifiablePath(file.path));
}

export function validateFilePaths(files: Array<{ path: string; content: string }>): {
  valid: boolean;
  invalidPaths: string[];
} {
  const invalidPaths: string[] = [];
  
  for (const file of files) {
    if (isProtectedPath(file.path)) {
      invalidPaths.push(file.path);
    }
  }
  
  return {
    valid: invalidPaths.length === 0,
    invalidPaths,
  };
}

