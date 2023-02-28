/*
 * Wazuh app - Wazuh syscollector process state equivalence
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

/*
 * PROCESS STATE CODES
 *    Here are the different values that the s, stat and state output specifiers (header "STAT" or "S") will display to describe the state of a
 *    process.
 *    D    Uninterruptible sleep (usually IO)
 *    R    Running or runnable (on run queue)
 *    S    Interruptible sleep (waiting for an event to complete)
 *    T    Stopped, either by a job control signal or because it is being traced.
 *    W    paging (not valid since the 2.6.xx kernel)
 *    X    dead (should never be seen)
 *    Z    Defunct ("zombie") process, terminated but not reaped by its parent.
 *
 *    For BSD formats and when the stat keyword is used, additional characters may be displayed:
 *    <    high-priority (not nice to other users)
 *    N    low-priority (nice to other users)
 *    L    has pages locked into memory (for real-time and custom IO)
 *    s    is a session leader
 *    l    is multi-threaded (using CLONE_THREAD, like NPTL pthreads do)
 *    +    is in the foreground process group
 */
export default {
  t: 'tracing stop',
  P: 'Parked',
  I: 'Idle',
  D: 'Uninterruptible sleep (usually IO)',
  R: 'Running or runnable (on run queue)',
  S: 'Interruptible sleep (waiting for an event to complete)',
  T: 'Stopped, either by a job control signal or because it is being traced.',
  W: 'paging (not valid since the 2.6.xx kernel)',
  X: 'Dead (should never be seen)',
  Z: 'Defunct ("zombie") process, terminated but not reaped by its parent.',
  '<': 'High-priority (not nice to other users)',
  N: 'Low-priority (nice to other users)',
  L: 'Has pages locked into memory (for real-time and custom IO)',
  s: 'Is a session leader',
  l: 'Is multi-threaded (using CLONE_THREAD, like NPTL pthreads do)',
  '+': 'Is in the foreground process group'
};
