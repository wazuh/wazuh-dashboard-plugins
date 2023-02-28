/*
 * Wazuh app - Component to group some components within another
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { useRef, useState, useEffect } from "react";


export const useParentWidth = () => {
    const ref = useRef(null);
    const [parentWidth, setParentWidth] = useState(0);

    useEffect(() => {
        setParentWidth((((ref || {}).current || {}).parentNode || {}).offsetWidth || 0);
    });
    return {parentWidth, ref};
}