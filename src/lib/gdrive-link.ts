// Helper link Google Drive — murni string, aman dipakai di client component.

export function isDriveLink(url: string): boolean {
  return url.includes("drive.google.com");
}

// Ambil file ID dari link Google Drive (format .../file/d/<id>/view)
export function driveFileIdFromLink(url: string): string | null {
  const m = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

// URL pratinjau/thumbnail langsung yang bisa disematkan sebagai <img>
export function driveThumbnailUrl(url: string, size = 1000): string | null {
  const id = driveFileIdFromLink(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w${size}` : null;
}
