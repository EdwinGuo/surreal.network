const sanitizedAddress = (addressString: string) => {
  let message = addressString;
  if (addressString.startsWith("0x")) {
    message = addressString.slice("0x".length);
  }
  return message.toLowerCase();
};

export { sanitizedAddress };
