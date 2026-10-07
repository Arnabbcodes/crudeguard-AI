/**
 * CrudeGuard AI - Interactive Leaflet Maritime Map
 * Visualizes global crude shipping routes, export terminals, and high-threat chokepoints.
 */

export const CrudeMap = {
  mapInstance: null,
  routeLayers: [],
  markerLayers: [],

  init(containerId, suppliers = [], chokepoints = [], refinery = null) {
    if (!window.L) {
      console.warn('[CrudeMap] Leaflet.js not loaded on page.');
      return null;
    }

    const container = document.getElementById(containerId);
    if (!container) return null;

    // Reset if previously initialized
    if (this.mapInstance) {
      try {
        this.mapInstance.remove();
      } catch {
        // ignore cleanup error
      }
      this.mapInstance = null;
    }

    // Initialize Map with dark tiles
    this.mapInstance = L.map(containerId, {
      center: [28, 15],
      zoom: 3,
      minZoom: 2,
      maxZoom: 9,
      zoomControl: true,
      attributionControl: false
    });

    // Dark Tile Layer (CartoDB Dark Matter)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(this.mapInstance);

    const ref = refinery || {
      name: 'Rotterdam Gateway Energy Complex',
      coordinates: [51.9244, 4.4777],
      dailyIntakeTargetBpd: 395000,
      strategicReserveDays: 18
    };

    // 1. Destination Refinery Marker
    const refIcon = L.divIcon({
      className: 'refinery-map-marker',
      html: `
        <div style="
          width: 24px; height: 24px; 
          background: #00E5FF; 
          border: 3px solid #FFFFFF; 
          border-radius: 50%; 
          box-shadow: 0 0 20px #00E5FF;
          display: flex; align-items: center; justify-content: center;
          cursor: pointer;
        ">
          <div style="width: 7px; height: 7px; background: #080D14; border-radius: 50%;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    L.marker(ref.coordinates, { icon: refIcon })
      .addTo(this.mapInstance)
      .bindPopup(`
        <div style="padding: 6px; font-family: sans-serif; color: #111;">
          <strong style="color: #007799; font-size: 13px;">★ ${ref.name}</strong><br>
          <span style="font-size: 11px; color: #333;">Intake Target: <b>${(ref.dailyIntakeTargetBpd || 395000).toLocaleString()} bpd</b></span><br>
          <span style="font-size: 11px; color: #333;">Reserve Buffer: <b>${ref.strategicReserveDays || 18} Days</b></span>
        </div>
      `);

    // 2. Chokepoint Threat Zones
    chokepoints.forEach(chk => {
      if (!chk.coordinates) return;

      const chkColor = chk.risk_level === 'Critical' ? '#FF4D6D' : '#FFB703';

      // Outer threat halo circle
      L.circle(chk.coordinates, {
        color: chkColor,
        fillColor: chkColor,
        fillOpacity: 0.18,
        radius: 380000,
        weight: 1.5,
        dashArray: '4, 6'
      }).addTo(this.mapInstance);

      // Center warning marker
      const chkIcon = L.divIcon({
        className: 'chokepoint-marker',
        html: `
          <div style="
            width: 14px; height: 14px;
            background: ${chkColor};
            border: 2px solid #FFFFFF;
            border-radius: 50%;
            box-shadow: 0 0 14px ${chkColor};
            cursor: pointer;
          "></div>
        `,
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      L.marker(chk.coordinates, { icon: chkIcon })
        .addTo(this.mapInstance)
        .bindPopup(`
          <div style="padding: 6px; font-family: sans-serif; color: #111;">
            <strong style="color: ${chkColor}; font-size: 13px;">⚠️ ${chk.name}</strong><br>
            <span style="font-size: 11px;">Status: <b>${chk.current_status}</b></span><br>
            <span style="font-size: 11px;">Throughput Impact: <b>-${chk.throughput_impact_pct}%</b></span><br>
            <p style="font-size: 10px; color: #555; margin-top: 4px; line-height: 1.3;">${chk.description}</p>
          </div>
        `);
    });

    // 3. Supplier Export Terminals & Route Lines
    suppliers.forEach(sup => {
      if (!sup.port_coordinates) return;

      const riskColor = sup.risk_level === 'Critical' ? '#FF4D6D' :
                        sup.risk_level === 'High' ? '#FF758F' :
                        sup.risk_level === 'Medium' ? '#FFB703' : '#06D6A0';

      const supIcon = L.divIcon({
        className: 'port-marker',
        html: `
          <div style="
            width: 13px; height: 13px;
            background: ${riskColor};
            border: 2px solid rgba(255,255,255,0.85);
            border-radius: 50%;
            box-shadow: 0 0 10px ${riskColor};
            cursor: pointer;
          "></div>
        `,
        iconSize: [13, 13],
        iconAnchor: [6.5, 6.5]
      });

      L.marker(sup.port_coordinates, { icon: supIcon })
        .addTo(this.mapInstance)
        .bindPopup(`
          <div style="padding: 6px; font-family: sans-serif; color: #111;">
            <strong style="font-size: 13px; color: #080D14;">${sup.name}</strong><br>
            <span style="font-size: 11px; color: #333;">Grade: <b>${sup.crude_grade}</b> (${sup.api_gravity}° API, ${sup.sulfur_pct}% S)</span><br>
            <span style="font-size: 11px; color: #333;">Volume: <b>${(sup.contracted_bpd || 0).toLocaleString()} bpd</b></span><br>
            <span style="font-size: 11px; color: ${riskColor}; font-weight: bold;">Risk Score: ${sup.risk_score}/100 (${sup.risk_level})</span>
          </div>
        `);

      // Curved / multi-waypoint shipping polyline to Rotterdam
      const waypoints = this.calculateRouteWaypoints(sup.port_coordinates, ref.coordinates);
      
      const line = L.polyline(waypoints, {
        color: riskColor,
        weight: (sup.contracted_bpd || 0) > 50000 ? 3 : 2,
        opacity: 0.7,
        dashArray: sup.risk_level === 'Critical' ? '6, 6' : null
      }).addTo(this.mapInstance);

      line.bindTooltip(`${sup.name} → Rotterdam (${sup.transit_days_normal || 20}d)`, {
        sticky: true,
        className: 'map-route-tooltip'
      });
    });

    // Invalidate size to ensure clean tile rendering
    setTimeout(() => {
      if (this.mapInstance) {
        this.mapInstance.invalidateSize();
      }
    }, 200);

    return this.mapInstance;
  },

  /**
   * Approximate realistic maritime transit waypoints
   */
  calculateRouteWaypoints(origin, destination) {
    const lat1 = origin[0], lon1 = origin[1];
    const lat2 = destination[0], lon2 = destination[1];

    // Middle East route (Persian Gulf)
    if (lon1 > 45 && lat1 > 20 && lat1 < 32) {
      return [
        [lat1, lon1],
        [26.5, 56.5], // Hormuz
        [12.5, 43.5], // Bab-el-Mandeb
        [27.5, 34.0], // Red Sea
        [31.2, 32.3], // Suez
        [36.0, 15.0], // Central Med
        [36.0, -5.3], // Gibraltar
        [45.0, -9.0], // Bay of Biscay
        [lat2, lon2]  // Rotterdam
      ];
    }

    // West Africa (Gulf of Guinea)
    if (lat1 < 10 && lat1 > 0 && lon1 < 15) {
      return [
        [lat1, lon1],
        [6.0, 2.0],
        [12.0, -18.0], // West Africa bulge
        [24.0, -17.5],
        [36.5, -9.5],  // Portugal coast
        [48.0, -5.0],  // English Channel
        [lat2, lon2]
      ];
    }

    // Brazil / South America
    if (lat1 < 0 && lon1 < 0) {
      return [
        [lat1, lon1],
        [-12.0, -35.0],
        [10.0, -28.0],
        [32.0, -18.0],
        [46.0, -7.0],
        [lat2, lon2]
      ];
    }

    // US Gulf (Corpus Christi / Permian)
    if (lon1 < -80 && lat1 > 20 && lat1 < 35) {
      return [
        [lat1, lon1],
        [24.5, -82.0], // Straits of Florida
        [30.0, -76.0],
        [40.0, -45.0], // Mid-Atlantic
        [48.0, -12.0], // English Channel Approach
        [lat2, lon2]
      ];
    }

    // North Sea / Short Sea (Norway, UK)
    return [
      [lat1, lon1],
      [(lat1 + lat2) / 2, (lon1 + lon2) / 2],
      [lat2, lon2]
    ];
  }
};
