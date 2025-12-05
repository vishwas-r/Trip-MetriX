import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Easing, Image } from 'react-native';
import Svg, { Path, Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useSettingsStore } from '../store/settingsStore';

const { width } = Dimensions.get('window');

interface SplashScreenProps {
    onFinish: () => void;
}

const Wheel = ({ rotate }: { rotate: Animated.AnimatedInterpolation<string> }) => (
    <Animated.View style={{ transform: [{ rotate }] }}>
        <Svg width={40} height={40} viewBox="0 0 40 40">
            <Circle cx="20" cy="20" r="18" fill="#1a1a1a" stroke="#333" strokeWidth="2" />
            <Circle cx="20" cy="20" r="12" fill="none" stroke="#555" strokeWidth="1" />
            {/* Rims */}
            <Path d="M20 2 L20 38" stroke="#444" strokeWidth="2" />
            <Path d="M2 20 L38 20" stroke="#444" strokeWidth="2" />
            <Path d="M7.27 7.27 L32.73 32.73" stroke="#444" strokeWidth="2" />
            <Path d="M32.73 7.27 L7.27 32.73" stroke="#444" strokeWidth="2" />
            <Circle cx="20" cy="20" r="4" fill="#888" />
        </Svg>
    </Animated.View>
);

const Car = ({ wheelRotate }: { wheelRotate: Animated.AnimatedInterpolation<string> }) => {
    const { accentColor } = useSettingsStore();

    return (
        <View style={{ width: 220, height: 80 }}>
            <Svg width={220} height={80} viewBox="0 0 220 80">
                <Defs>
                    <LinearGradient id="carBody" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0" stopColor="#1a1a1a" />
                        <Stop offset="0.5" stopColor={accentColor} />
                        <Stop offset="1" stopColor="#1a1a1a" />
                    </LinearGradient>
                    <LinearGradient id="window" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor="#111" />
                        <Stop offset="1" stopColor="#444" />
                    </LinearGradient>
                </Defs>
                {/* Car Body - More aerodynamic, facing RIGHT */}
                {/* Nose at 215, Tail at 5 */}
                <Path
                    d="M5 45 L5 30 L30 25 L70 15 L140 15 L190 30 L215 45 L215 55 L195 60 L25 60 L5 55 Z"
                    fill="url(#carBody)"
                    stroke="#333"
                    strokeWidth="1"
                />
                {/* Cabin / Windows */}
                <Path
                    d="M35 28 L70 18 L140 18 L180 30 Z"
                    fill="url(#window)"
                />
                {/* Spoiler */}
                <Path d="M0 25 L30 25 L5 35 Z" fill="#111" />

                {/* Headlight (Right) */}
                <Path d="M200 35 L215 38 L210 45 L195 42 Z" fill="#fbbf24" />
                {/* Taillight (Left) */}
                <Path d="M5 35 L15 35 L15 45 L5 45 Z" fill="#ef4444" />
            </Svg>
            {/* Wheels positioned absolutely */}
            <View style={{ position: 'absolute', bottom: 5, left: 40 }}>
                <Wheel rotate={wheelRotate} />
            </View>
            <View style={{ position: 'absolute', bottom: 5, right: 45 }}>
                <Wheel rotate={wheelRotate} />
            </View>
        </View>
    );
};

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const carPosition = useRef(new Animated.Value(-300)).current; // Start off-screen left
    const fadeOpacity = useRef(new Animated.Value(0)).current; // For Logo
    const wheelRotation = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const centerPos = (width / 2) - 110; // Center of screen (car width 220)
        const endPos = width + 50; // Off-screen right

        Animated.sequence([
            // 1. Drive to center
            Animated.parallel([
                Animated.timing(carPosition, {
                    toValue: centerPos,
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                }),
                Animated.timing(wheelRotation, {
                    toValue: 1, // 1 full rotation (approx)
                    duration: 1500,
                    useNativeDriver: true,
                    easing: Easing.out(Easing.cubic),
                })
            ]),
            // 2. Pause and show logo
            Animated.timing(fadeOpacity, {
                toValue: 1,
                duration: 800,
                useNativeDriver: true,
            }),
            Animated.delay(500),
            // 3. Drive off screen
            Animated.parallel([
                Animated.timing(carPosition, {
                    toValue: endPos,
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.cubic),
                }),
                Animated.timing(wheelRotation, {
                    toValue: 3, // More rotations for speed
                    duration: 1000,
                    useNativeDriver: true,
                    easing: Easing.in(Easing.cubic),
                }),
                Animated.timing(fadeOpacity, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                })
            ])
        ]).start(() => {
            onFinish();
        });
    }, []);

    const rotate = wheelRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg']
    });

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <Animated.View style={{ transform: [{ translateX: carPosition }] }}>
                    <Car wheelRotate={rotate} />
                </Animated.View>

                {/* Logo below car */}
                <Animated.View style={[styles.logoContainer, { opacity: fadeOpacity }]}>
                    <Image
                        source={require('../../assets/logo.png')}
                        style={{ width: 150, height: 150, resizeMode: 'contain' }}
                    />
                </Animated.View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000', // Ultra realistic dark mode base
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        width: '100%',
        height: 300,
        justifyContent: 'center',
    },
    logoContainer: {
        position: 'absolute',
        bottom: -50,
        width: '100%',
        alignItems: 'center',
    },
});
