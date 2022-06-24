/*
 * Wazuh app - Common data to generate 
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

// Common data
export const IPs = ['141.98.81.37', '54.10.24.5', '187.80.4.18', '134.87.21.47', '40.220.102.15', '45.124.37.241', '45.75.196.15', '16.4.20.20'];
export const Users = ["root", "ec2-user", "SYSTEM", "wazuh", "Administrators", "suricata", "LOCAL\ Service", "NETWORK\ Service"];
export const Ports = ["22", "55047", "26874", "8905", "3014", "2222", "4547", "3475", "7558", "4277", "3527", "5784", "7854"];
export const Win_Hostnames = ['Win_Server_01', 'Win_Server_02', 'Win_Server_03', 'Win_Server_04'];
export const Paths = ["/home/user/sample", "/tmp/sample", "/etc/sample"];

// Agents
export const Agents = [
  // { id: '000', name: 'master', ip: '120.17.47.10' }, 
  {
    id: '001',
    name: 'RHEL7',
    ip: '187.54.247.68'
  },
  {
    id: '002',
    name: 'Amazon',
    ip: '145.80.240.15'
  },
  {
    id: '003',
    name: 'ip-10-0-0-180.us-west-1.compute.internal',
    ip: '10.0.0.180'
  },
  {
    id: '004',
    name: 'Ubuntu',
    ip: '47.204.15.21'
  },
  {
    id: '005',
    name: 'Centos',
    ip: '197.17.1.4'
  },
  {
    id: '006',
    name: 'Windows',
    ip: '207.45.34.78'
  },
  {
    id: '007',
    name: 'Debian',
    ip: '24.273.97.14'
  }
];

// Geolocation {country_name, location: {lat, lon }, region_name}
export const GeoLocation = [{
    country_name: 'Spain',
    location: {
      lat: 37.1881714,
      lon: -3.6066699
    },
    region_name: 'Andalucía',
    city_name: 'Granada'
  },
  {
    country_name: 'France',
    location: {
      lat: 48.8534088,
      lon: 2.3487999
    },
    region_name: 'Paris',
    city_name: 'Paris'
  },
  {
    country_name: 'England',
    location: {
      lat: 51.5085297,
      lon: -0.12574
    },
    region_name: 'London',
    city_name: 'London'
  },
  {
    country_name: 'Germany',
    location: {
      lat: 52.524,
      lon: 13.411
    },
    region_name: 'Berlin',
    city_name: 'Berlin'
  },
  {
    country_name: 'United States of America',
    location: {
      lat: 40.7142715,
      lon: -74.0059662
    },
    region_name: 'New York',
    city_name: 'New York'

  },
  {
    country_name: 'Canada',
    location: {
      lat: 49.2496605,
      lon: -123.119339
    },
    region_name: 'Vancouver',
    city_name: 'Vancouver'
  },
  {
    country_name: 'Brasil',
    location: {
      lat: -22.9064198,
      lon: -43.1822319
    },
    region_name: 'Río de Janeiro',
    city_name: 'Río de Janeiro'
  },
  {
    country_name: 'India',
    location: {
      lat: 19.0728302,
      lon: 72.8826065
    },
    region_name: 'Bombay',
    city_name: 'Bombay'
  },
  {
    country_name: 'Australia',
    location: {
      lat: -33.8678513,
      lon: 151.2073212
    },
    region_name: 'Sydney',
    city_name: 'Sydney'
  },
  {
    country_name: 'China',
    location: {
      lat: 31.222,
      lon: 121.458
    },
    region_name: 'Shanghai',
    city_name: 'Shanghai'
  },
];

/**
 * Get a random element of an array
 * @param {[]} array - Array to get a randomized element
 * @returns {any} - Element randomized
 */
function randomStrItem(str) {
  let array = str.split('');
  return array[Math.floor(array.length * Math.random())];
}

export const randomElements = (length, elements) => {
  let hash = '';

  for (let i = 0; i < length; i++) {
    hash += randomStrItem(elements);
  }

  return hash;
}

export const randomArrayItem = (array) => {
  return array[Math.floor(array.length * Math.random())];

}
