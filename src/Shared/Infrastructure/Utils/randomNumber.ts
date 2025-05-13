export function generateUniqueNumericId() {
  // Get current timestamp in milliseconds
  const timestamp = Date.now();
  // Generate random component (1000-9999)
  const randomComponent = Math.floor(Math.random() * 9000) + 1000;
  // Combine them - timestamp followed by random digits
  const uniqueId = timestamp * 10000 + randomComponent;
  return uniqueId;
}

// Example usage
