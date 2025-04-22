/**
 * Random utility functions to help with data generation
 */

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer
 */
function int(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Choose a random element from an array
 * @param {Array} array - Array to choose from
 * @returns {*} Random element from the array
 */
function choice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * Generate a random boolean value
 * @returns {boolean} Random boolean
 */
function boolean() {
  return Math.random() >= 0.5;
}

/**
 * Generate a random date string in ISO format
 * @returns {string} Random date string
 */
function date() {
  const startDate = new Date();
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() - 10);

  // Random date between start_date and end_date
  const randomDate = new Date(
    endDate.getTime() +
      Math.random() * (startDate.getTime() - endDate.getTime()),
  );

  // Format date to match the Python format
  return randomDate.toISOString();
}

/**
 * Generate a random unix timestamp
 * @returns {number} Random unix timestamp
 */
function unixTimestamp() {
  const startTime = new Date(2000, 0, 1).getTime();
  const endTime = new Date().getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);
  return Math.floor(randomTime / 1000);
}

/**
 * Generate a random IP address
 * @returns {string} Random IP address
 */
function ip() {
  return `${int(1, 255)}.${int(0, 255)}.${int(0, 255)}.${int(0, 255)}`;
}

/**
 * Generate a random MAC address
 * @returns {string} Random MAC address
 */
function macAddress() {
  const mac = Array(6)
    .fill()
    .map(() => int(0, 255));
  return mac.map(octet => octet.toString(16).padStart(2, '0')).join(':');
}

/**
 * Generate a random float between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {number} decimals - Number of decimal places (default: 2)
 * @returns {number} Random float
 */
function float(min = 0, max = 1, decimals = 2) {
  const randomFloat = Math.random() * (max - min) + min;
  const factor = Math.pow(10, decimals);
  return Math.round(randomFloat * factor) / factor;
}

module.exports = {
  int,
  choice,
  boolean,
  date,
  unixTimestamp,
  ip,
  macAddress,
  float, // Exportamos la nueva función
};
