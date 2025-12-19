import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

interface LeafletMapProps {
    latitude: number;
    longitude: number;
    heading?: number;
    accuracy?: number;
    orientation?: 'north-up' | 'heading-up';
    path?: { latitude: number; longitude: number }[];
    accentColor?: string;
    fitToPath?: boolean;
    showMarkers?: boolean;
    followUser?: boolean;
    isDark?: boolean;
    onMapEvent?: (event: { type: string; message?: string }) => void;
    onError?: (error: string) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
    latitude,
    longitude,
    heading = 0,
    accuracy = 0,
    orientation = 'north-up',
    path = [],
    accentColor = '#3b82f6',
    fitToPath = false,
    showMarkers = false,
    followUser = true,
    isDark = true,
    onMapEvent,
    onError
}) => {
    const webViewRef = useRef<WebView>(null);
    const [isWebViewLoaded, setIsWebViewLoaded] = React.useState(false);

    // HTML Content for the WebView using MapLibre GL JS
    const htmlContent = React.useMemo(() => `
    <!DOCTYPE html>
    <html>
    <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <script src="https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.js"></script>
        <link href="https://cdn.jsdelivr.net/npm/maplibre-gl@4.7.1/dist/maplibre-gl.css" rel="stylesheet" />
        <style>
            body { margin: 0; padding: 0; background-color: ${isDark ? 'black' : 'white'}; width: 100%; height: 100%; overflow: hidden; }
            #map { 
                position: absolute; 
                top: 0; 
                bottom: 0; 
                left: 0;
                right: 0;
                width: 100%; 
                height: 100%;
                background: ${isDark ? '#000' : '#fff'};
                touch-action: none; /* Prevent browser handling of gestures */
            }
            
            /* Compass Control */
            .compass-control {
                position: absolute;
                bottom: 140px; /* Gap of 15px from Locate button */
                right: 10px;
                width: 40px;
                height: 40px;
                background: white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 0.3s ease;
            }
            
            /* Locate Control */
            .locate-control {
                position: absolute;
                bottom: 85px; /* Gap of 15px from Zoom controls (approx 70px top) */
                right: 10px;
                width: 40px;
                height: 40px;
                background: white;
                border-radius: 50%;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
            }
            .locate-icon {
                width: 24px;
                height: 24px;
                fill: #666;
                transition: fill 0.3s ease;
            }
            .locate-active .locate-icon {
                fill: #4285F4; /* Google Blue when active */
            }

            .compass-icon {
                width: 24px;
                height: 24px;
                transition: transform 0.1s linear;
            }
            /* North Up Icon: N with arrow */
            .north-icon {
                font-weight: bold;
                color: #333;
                font-family: sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                transform: scale(0.9);
            }
            .north-arrow {
                width: 0; 
                height: 0; 
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
                border-bottom: 8px solid #ef4444; /* Red arrow */
                margin-bottom: 2px;
            }
            /* Heading Up Icon: Needle */
            .needle-icon {
                width: 100%;
                height: 100%;
                position: relative;
                transform: scale(0.7); /* Add visual padding */
            }
            .needle-north {
                position: absolute;
                left: 50%;
                top: 0;
                width: 0;
                height: 0;
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
                border-bottom: 12px solid #ef4444; /* Red North */
                transform: translateX(-50%);
            }
            .needle-south {
                position: absolute;
                left: 50%;
                bottom: 0;
                width: 0;
                height: 0;
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
                border-top: 12px solid #9ca3af; /* Grey South */
                transform: translateX(-50%);
            }

            /* Custom Marker Styles */
            .user-marker-container {
                width: 40px; 
                height: 40px; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                transition: transform 0.1s linear;
                cursor: pointer; /* Make it clickable */
            }
            .user-marker-circle {
                position: absolute; 
                width: 16px; /* Reduced from 20px */
                height: 16px; /* Reduced from 20px */
                background-color: #4285F4; /* Google Blue */
                border: 2px solid white; 
                border-radius: 50%; 
                box-shadow: 0 0 4px rgba(0,0,0,0.3); 
                z-index: 10;
                pointer-events: auto; /* Ensure clicks are captured */
            }
            .user-marker-beam {
                position: absolute; 
                top: -30px;
                left: -30px;
                width: 100px; 
                height: 100px; 
                /* Slightly darker than outer circle (0.2) -> 0.4 */
                background: radial-gradient(circle at 50% 50%, rgba(66, 133, 244, 0.4), transparent 70%);
                clip-path: polygon(50% 50%, 20% 0%, 80% 0%);
                z-index: 5;
                transform-origin: center;
                pointer-events: none; /* Let clicks pass through beam */
            }

            .custom-marker {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .marker-pin {
                width: 30px;
                height: 30px;
                border-radius: 50% 50% 50% 0;
                background: #4b5563;
                position: absolute;
                transform: rotate(-45deg);
                left: 50%;
                top: 50%;
                margin: -15px 0 0 -15px;
                box-shadow: 0 3px 5px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .marker-pin::after {
                content: '';
                width: 24px;
                height: 24px;
                background: #fff;
                position: absolute;
                border-radius: 50%;
                transform: rotate(45deg);
            }
            .marker-icon {
                position: absolute;
                z-index: 10;
                transform: rotate(45deg);
                font-size: 14px;
                font-weight: bold;
                color: #4b5563;
                display: flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: 100%;
            }
        </style>
    </head>
    <body>
        <div id="map"></div>
        <div id="locate" class="locate-control">
            <svg class="locate-icon" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-7 7z"/>
            </svg>
        </div>
        <div id="compass" class="compass-control">
            <div class="north-icon"><div class="north-arrow"></div>N</div>
        </div>
        <script>
            // Error handling
            window.onerror = function(message, source, lineno, colno, error) {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: message }));
            };

            var map;
            var userMarker;
            var startMarker;
            var endMarker;
            var compassEl = document.getElementById('compass');
            var locateEl = document.getElementById('locate');

            // Helper to create a circle polygon
            function createCircle(center, radiusInMeters, points) {
                if (!points) points = 64;
                var coords = {
                    latitude: center[1],
                    longitude: center[0]
                };
                var km = radiusInMeters / 1000;
                var ret = [];
                var distanceX = km / (111.320 * Math.cos(coords.latitude * Math.PI / 180));
                var distanceY = km / 110.574;

                var theta, x, y;
                for(var i=0; i<points; i++) {
                    theta = (i / points) * (2 * Math.PI);
                    x = distanceX * Math.cos(theta);
                    y = distanceY * Math.sin(theta);
                    ret.push([coords.longitude + x, coords.latitude + y]);
                }
                ret.push(ret[0]);
                return {
                    type: "Feature",
                    geometry: {
                        type: "Polygon",
                        coordinates: [ret]
                    }
                };
            }

            function initMap() {
                try {
                    // Ensure map container has size
                    var mapContainer = document.getElementById('map');
                    if (!mapContainer) throw new Error("Map container not found");

                    map = new maplibregl.Map({
                        container: 'map',
                        style: {
                            'version': 8,
                            'sources': {
                                'osm': {
                                    'type': 'raster',
                                    'tiles': [
                                        'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
                                    ],
                                    'tileSize': 256,
                                    'attribution': '&copy; OpenStreetMap Contributors'
                                }
                            },
                            'layers': [{
                                'id': 'osm',
                                'type': 'raster',
                                'source': 'osm',
                                'minzoom': 0,
                                'maxzoom': 19
                            }]
                        },
                        center: [0, 0],
                        zoom: 16,
                        attributionControl: false
                    });

                    // Add navigation control (zoom buttons)
                    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');

                    // Compass Logic
                    compassEl.addEventListener('click', function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'toggle_orientation' }));
                    });

                    // Locate Logic
                    locateEl.addEventListener('click', function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'locate_user' }));
                    });

                    // User Marker Initialization
                    var userMarkerEl = document.createElement('div');
                    userMarkerEl.className = 'user-marker-container';
                    userMarkerEl.innerHTML = '<div class="user-marker-beam"></div><div class="user-marker-circle"></div>';
                    
                    // Add click listener to user marker to toggle orientation
                    userMarkerEl.addEventListener('click', function(e) {
                        e.stopPropagation(); // Prevent map click
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'locate_user' }));
                    });

                    userMarker = new maplibregl.Marker({ element: userMarkerEl })
                        .setLngLat([0, 0])
                        .addTo(map);

                    map.on('load', function () {
                        // Add route source and layer
                        map.addSource('route', {
                            'type': 'geojson',
                            'data': {
                                'type': 'Feature',
                                'properties': {},
                                'geometry': {
                                    'type': 'LineString',
                                    'coordinates': []
                                }
                            }
                        });

                        // Add accuracy source
                        map.addSource('user-accuracy', {
                            'type': 'geojson',
                            'data': {
                                'type': 'FeatureCollection',
                                'features': []
                            }
                        });
                        
                        map.addLayer({
                            'id': 'route',
                            'type': 'line',
                            'source': 'route',
                            'layout': {
                                'line-join': 'round',
                                'line-cap': 'round'
                            },
                            'paint': {
                                'line-color': '${accentColor}',
                                'line-width': 4
                            }
                        });

                        // Add accuracy layer
                        map.addLayer({
                            'id': 'user-accuracy-layer',
                            'type': 'fill',
                            'source': 'user-accuracy',
                            'layout': {},
                            'paint': {
                                'fill-color': '#4285F4',
                                'fill-opacity': 0.2
                            }
                        });

                        // Notify RN that map is loaded
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_loaded' }));
                        
                        // Force resize to ensure map renders correctly
                        map.resize();
                    });

                    map.on('dragstart', function() {
                        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'map_drag' }));
                    });

                } catch (e) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'error', message: e.toString() }));
                }
            }

            // Initialize map immediately
            initMap();

            function createCustomMarkerElement(type) {
                var el = document.createElement('div');
                el.className = 'custom-marker';
                var iconHtml = '';
                if (type === 'start') {
                    iconHtml = '<div class="marker-pin"><div class="marker-icon" style="width: 8px; height: 8px; background-color: #4b5563; border-radius: 50%;"></div></div>';
                } else if (type === 'end') {
                    iconHtml = '<div class="marker-pin"><div class="marker-icon">🏁</div></div>';
                }
                el.innerHTML = iconHtml;
                return el;
            }

            function updateMap(lat, lng, heading, accuracy, orientation, newPath, shouldFitBounds, showMarkers, followUser) {
                if (!map) return;

                var newLngLat = [lng, lat];
                
                // Update User Marker Position
                if (userMarker) userMarker.setLngLat(newLngLat);

                // Update Accuracy Circle
                if (map.getSource('user-accuracy')) {
                    if (accuracy > 0) {
                        var accuracyCircle = createCircle(newLngLat, accuracy);
                        map.getSource('user-accuracy').setData(accuracyCircle);
                    } else {
                        map.getSource('user-accuracy').setData({
                            'type': 'FeatureCollection',
                            'features': []
                        });
                    }
                }

                // Update Locate Button State
                if (followUser) {
                    locateEl.classList.add('locate-active');
                } else {
                    locateEl.classList.remove('locate-active');
                }
                
                // Update Compass Icon & Rotation
                if (orientation === 'north-up') {
                    compassEl.innerHTML = '<div class="north-icon"><div class="north-arrow"></div>N</div>';
                    compassEl.style.transform = 'rotate(0deg)'; // Always upright
                    
                    // Map is North Up (bearing 0)
                    map.easeTo({ bearing: 0, duration: 500 });
                    
                    // User marker arrow rotates with heading
                    if (userMarker) {
                        var userMarkerEl = userMarker.getElement();
                        if (userMarkerEl) userMarkerEl.style.transform = 'rotate(' + heading + 'deg)';
                    }
                } else {
                    // Heading Up
                    compassEl.innerHTML = '<div class="needle-icon"><div class="needle-north"></div><div class="needle-south"></div></div>';
                    
                    // Map rotates to match heading (bearing = heading)
                    map.easeTo({ bearing: heading, duration: 500, easing: (t) => t });
                    
                    // Compass button should point North. 
                    compassEl.style.transform = 'rotate(' + (-heading) + 'deg)';
                    
                    // User marker arrow stays pointing up
                    if (userMarker) {
                        var userMarkerEl = userMarker.getElement();
                        if (userMarkerEl) userMarkerEl.style.transform = 'rotate(0deg)';
                    }
                }

                // Follow User
                if (!shouldFitBounds && followUser) {
                    map.easeTo({ center: newLngLat, duration: 300 });
                }

                // Update Path
                if (map.getSource('route')) {
                    var coords = newPath.map(p => [p.longitude, p.latitude]);
                    map.getSource('route').setData({
                        'type': 'Feature',
                        'properties': {},
                        'geometry': {
                            'type': 'LineString',
                            'coordinates': coords
                        }
                    });

                    if (shouldFitBounds && coords.length > 0) {
                        var bounds = coords.reduce(function(bounds, coord) {
                            return bounds.extend(coord);
                        }, new maplibregl.LngLatBounds(coords[0], coords[0]));

                        map.fitBounds(bounds, { padding: 50 });
                    }
                    
                    // Handle Start/End Markers
                    if (showMarkers && newPath.length > 0) {
                        var start = newPath[0];
                        var end = newPath[newPath.length - 1];

                        if (!startMarker) {
                            startMarker = new maplibregl.Marker({ element: createCustomMarkerElement('start') })
                                .setLngLat([start.longitude, start.latitude])
                                .addTo(map);
                        } else {
                            startMarker.setLngLat([start.longitude, start.latitude]);
                        }

                        if (!endMarker) {
                            endMarker = new maplibregl.Marker({ element: createCustomMarkerElement('end') })
                                .setLngLat([end.longitude, end.latitude])
                                .addTo(map);
                        } else {
                            endMarker.setLngLat([end.longitude, end.latitude]);
                        }
                        
                        if (userMarker) userMarker.getElement().style.opacity = '0';
                    } else {
                        if (startMarker) startMarker.remove();
                        if (endMarker) endMarker.remove();
                        startMarker = null;
                        endMarker = null;
                        if (userMarker) userMarker.getElement().style.opacity = '1';
                    }
                }
            }

            // Listen for messages
            document.addEventListener('message', function(event) {
                var data = JSON.parse(event.data);
                updateMap(data.latitude, data.longitude, data.heading, data.accuracy, data.orientation, data.path, data.fitToPath, data.showMarkers, data.followUser);
            });
            window.addEventListener('message', function(event) {
                var data = JSON.parse(event.data);
                updateMap(data.latitude, data.longitude, data.heading, data.accuracy, data.orientation, data.path, data.fitToPath, data.showMarkers, data.followUser);
            });
        </script>
    </body>
    </html>
    `, [accentColor, isDark]);

    const updateMapState = () => {
        if (webViewRef.current) {
            const data = JSON.stringify({
                latitude,
                longitude,
                heading,
                accuracy,
                orientation,
                path,
                fitToPath,
                showMarkers,
                followUser
            });
            webViewRef.current.postMessage(data);
        }
    };

    // Update map when props change
    useEffect(() => {
        if (isWebViewLoaded) {
            updateMapState();
        }
    }, [latitude, longitude, heading, accuracy, orientation, path, fitToPath, showMarkers, followUser, isWebViewLoaded]);

    const handleMessage = (event: any) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (onMapEvent) {
                onMapEvent(data);
            }
            if (data.type === 'error') {
                console.error("MapWebView Error:", data.message);
                if (onError) onError(data.message);
            }
        } catch (e) {
            // Ignore
        }
    };

    return (
        <View style={styles.container}>
            <WebView
                ref={webViewRef}
                originWhitelist={['*']}
                source={{ html: htmlContent }}
                style={styles.webview}
                scrollEnabled={false}
                bounces={false}
                overScrollMode="never"
                javaScriptEnabled={true}
                onMessage={handleMessage}
                onLoadEnd={() => {
                    setIsWebViewLoaded(true);
                    // Initial update
                    setTimeout(() => updateMapState(), 500);
                }}
                onError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView error: ', nativeEvent);
                    if (onError) onError('Failed to load map');
                }}
                onHttpError={(syntheticEvent) => {
                    const { nativeEvent } = syntheticEvent;
                    console.warn('WebView HTTP error: ', nativeEvent);
                    if (onError) onError('Failed to load map resources');
                }}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
    },
    webview: {
        flex: 1,
        backgroundColor: 'transparent',
    },
});
