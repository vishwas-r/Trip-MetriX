import React, { useEffect, useRef } from 'react';
import { View, Text, Dimensions, StyleSheet, Animated, Easing, Image } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSettingsStore } from '../store/settingsStore';

const { width } = Dimensions.get('window');
const SIZE = width * 0.9;
const STROKE_WIDTH = 20;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CENTER = SIZE / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Create an Animated component for the SVG Circle
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface SpeedometerProps {
    speed: number; // in m/s
}

export const Speedometer: React.FC<SpeedometerProps> = ({ speed }) => {
    const { unit, accentColor, theme } = useSettingsStore();
    const animatedSpeed = useRef(new Animated.Value(0)).current;

    const isDark = theme === 'dark' || (theme === 'system' && true);
    const textColor = isDark ? 'white' : '#111827';
    const trackColor = isDark ? '#1f2937' : '#e5e7eb';
    const unitColor = isDark ? '#9ca3af' : '#6b7280';

    const displaySpeed = (() => {
        switch (unit) {
            case 'mph': return speed * 2.23694;
            case 'm/s': return speed;
            default: return speed * 3.6;
        }
    })();

    const maxSpeed = (() => {
        switch (unit) {
            case 'mph': return 160;
            case 'm/s': return 80;
            default: return 240;
        }
    })();

    useEffect(() => {
        Animated.timing(animatedSpeed, {
            toValue: displaySpeed,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [displaySpeed]);

    const strokeDashoffset = animatedSpeed.interpolate({
        inputRange: [0, maxSpeed],
        outputRange: [CIRCUMFERENCE, CIRCUMFERENCE * 0.25], // Start full circle (hidden), end at 25% (75% visible)
        extrapolate: 'clamp',
    });

    return (
        <View style={styles.container}>
            <View style={{ width: SIZE, height: SIZE }}>
                <Image
                    source={require('../../assets/logo.png')}
                    style={[styles.backgroundImage, { opacity: isDark ? 0.25 : 0.1 }]}
                />
                <Svg width={SIZE} height={SIZE}>
                    {/* Background Track */}
                    <Circle
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        stroke={trackColor}
                        strokeWidth={STROKE_WIDTH}
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={CIRCUMFERENCE * 0.25} // Hide bottom 25%
                        strokeLinecap="round"
                        rotation="-225"
                        origin={`${CENTER}, ${CENTER}`}
                        fill="none"
                    />

                    {/* Progress Arc */}
                    <AnimatedCircle
                        cx={CENTER}
                        cy={CENTER}
                        r={RADIUS}
                        stroke={accentColor}
                        strokeWidth={STROKE_WIDTH}
                        strokeDasharray={CIRCUMFERENCE}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        rotation="-225"
                        origin={`${CENTER}, ${CENTER}`}
                        fill="none"
                    />
                </Svg>

                {/* Digital Speed Display */}
                <View style={styles.textContainer}>
                    <Text style={[styles.speedText, { color: textColor }]}>
                        {Math.round(displaySpeed)}
                    </Text>
                    <Text style={[styles.unitText, { color: unitColor }]}>
                        {unit}
                    </Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    backgroundImage: {
        position: 'absolute',
        width: '75%',
        height: '75%',
        top: '12.5%',
        left: '12.5%',
        resizeMode: 'contain',
    },
    textContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    speedText: {
        fontSize: 60,
        fontFamily: 'Orbitron_700Bold',
    },
    unitText: {
        fontSize: 20,
        fontWeight: '500',
        textTransform: 'uppercase',
        fontFamily: 'Orbitron_500Medium',
    },
});
