/*
 * Wazuh app - Common data to generate 
 * Copyright (C) 2015-2020 Wazuh, Inc.
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
export const Users = ['juanca','pablo','jose', 'alberto', 'antonio', 'victor', 'jesus', 'santiago', 'pedro', 'root', 'admin']
export const Ports = [22, 55047, 26874, 8905, 3014, 2222, 4547];
export const Win_Hostnames = ['Win_Server_01', 'Win_Server_02', 'Win_Server_03','Win_Server_04'];
export const Paths = ["/home/user/sample", "/tmp/sample", "/etc/sample"];

// Agents
export const Agents = [
  // { id: '000', name: 'master', ip: '120.17.47.10' }, 
  { id: '001', name: 'agent-jcr', ip: '187.54.247.68' }, 
  { id: '002', name: 'agent-pt', ip: '145.80.240.15' }, 
  { id: '003', name: 'agent-js', ip: '17.45.131.90' }, 
  { id: '004', name: 'agent-aa', ip: '47.204.15.21' }, 
  { id: '005', name: 'agent-vs', ip: '197.17.1.4' }, 
  { id: '006', name: 'agent-ag', ip: '207.45.34.78' }, 
  { id: '007', name: 'agent-jr', ip: '24.273.97.14' }
]; // Yes, each developer has an agent :P

// Geolocation {country_name, location: {lon, lat}, region_name}
export const GeoLocation = [
  {
      country_name: 'España',
      location: {
          lon: 37.1881714,
          lat: -3.6066699
      },
      region_name: 'Andalusia',
      city_name: 'Granada'
  },
  {
      country_name: 'France',
      location: {
          lon: 48.8534088,
          lat: 2.3487999
      },
      region_name: 'Paris',
      city_name: 'Paris'
  },
  {
      country_name: 'England',
      location: {
          lon: 51.5085297,
          lat: -0.12574
      },
      region_name: 'London',
      city_name: 'London'
  },
  {
      country_name: 'Germany',
      location: {
          lon: 52.524,
          lat: 13.411
      },
      region_name: 'Berlin',
      city_name: 'Berlin'
  },
  {
      country_name: 'United States of America',
      location: {
          lon: 40.7142715,
          lat: -74.0059662
      },
      region_name: 'New York',
      city_name: 'New York'

  },
  {
      country_name: 'Canada',
      location: {
          lon: 49.2496605,
          lat: -123.119339
      },
      region_name: 'Vancouver',
      city_name: 'Vancouver'
  },
  {
      country_name: 'Brasil',
      location: {
          lon: -22.9064198,
          lat: -43.1822319
      },
      region_name: 'Río de Janeiro',
      city_name: 'Río de Janeiro'
  },
  {
      country_name: 'India',
      location: {
          lon: 19.0728302,
          lat: 72.8826065
      },
      region_name: 'Bombay',
      city_name: 'Bombay'
  },
  {
      country_name: 'Australia',
      location: {
          lon: -33.8678513,
          lat: 151.2073212
      },
      region_name: 'Sydney',
      city_name: 'Sydney'
  },
  {
      country_name: 'China',
      location: {
          lon: 31.222,
          lat: 121.458
      },
      region_name: 'Shanghai',
      city_name: 'Shanghai'
  },
];
