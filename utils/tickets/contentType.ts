const TYPES: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  pdf: 'application/pdf',
}

export function ticketContentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase() ?? ''
  return TYPES[extension] ?? 'application/octet-stream'
}
