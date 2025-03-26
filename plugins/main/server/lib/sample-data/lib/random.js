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
  const start_date = new Date();
  const end_date = new Date(start_date);
  end_date.setDate(end_date.getDate() - 10);
  
  // Random date between start_date and end_date
  const random_date = new Date(end_date.getTime() + Math.random() * (start_date.getTime() - end_date.getTime()));
  
  // Format date to match the Python format
  return random_date.toISOString();
}

/**
 * Generate a random unix timestamp
 * @returns {number} Random unix timestamp
 */
function unixTimestamp() {
  const start_time = new Date(2000, 0, 1).getTime();
  const end_time = new Date().getTime();
  const random_time = start_time + Math.random() * (end_time - start_time);
  return Math.floor(random_time / 1000);
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
  const mac = Array(6).fill().map(() => int(0, 255));
  return mac.map(octet => octet.toString(16).padStart(2, '0')).join(':');
}

module.exports = {
  int,
  choice,
  boolean,
  date,
  unixTimestamp,
  ip,
  macAddress
};