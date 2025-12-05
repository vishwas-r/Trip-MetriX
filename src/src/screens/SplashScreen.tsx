import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, Text, Easing, Image } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const { width } = Dimensions.get('window');
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CustomSplashScreenProps {
    onAnimationFinish: () => void;
}

export default function CustomSplashScreen({ onAnimationFinish }: CustomSplashScreenProps) {
    const fadeAnim = useRef(new Animated.Value(1)).current;
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const progressAnim = useRef(new Animated.Value(0)).current;
    const needleAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const animate = async () => {
            await new Promise(resolve => setTimeout(resolve, 100));
            await SplashScreen.hideAsync();

            // Sequence:
            // 1. Gauge fills up
            // 2. Needle sweeps
            // 3. Fade out and zoom

            Animated.sequence([
                Animated.parallel([
                    Animated.timing(progressAnim, {
                        toValue: 1,
                        duration: 1000,
                        easing: Easing.out(Easing.cubic),
                        useNativeDriver: true,
                    }),
                    Animated.timing(needleAnim, {
                        toValue: 1,
                        duration: 1200,
                        easing: Easing.elastic(1),
                        useNativeDriver: true,
                    }),
                ]),
                Animated.delay(300),
                Animated.parallel([
                    Animated.timing(fadeAnim, {
                        toValue: 0,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 5,
                        duration: 600,
                        useNativeDriver: true,
                    }),
                ])
            ]).start(() => {
                onAnimationFinish();
            });
        };

        animate();
    }, []);

    // Gauge parameters
    const size = 160;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;

    // Interpolate progress for the circle stroke
    const strokeDashoffset = progressAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [circumference, 0], // Full circle draw
    });

    // Interpolate needle rotation
    const needleRotation = needleAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['-135deg', '45deg'], // Sweep from left to right
    });

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>

                <View style={styles.gaugeContainer}>
                    {/* Background Logo */}
                    <Image
                        source={require('../../assets/icon.png')}
                        style={styles.backgroundLogo}
                    />

                    {/* SVG Gauge */}
                    <Svg width={size} height={size}>
                        <Defs>
                            <LinearGradient id="grad" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0" stopColor="#00f3ff" stopOpacity="0.2" />
                                <Stop offset="1" stopColor="#00f3ff" stopOpacity="1" />
                            </LinearGradient>
                        </Defs>

                        {/* Background Track */}
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke="#1f2937"
                            strokeWidth={strokeWidth}
                            fill="none"
                        />

                        {/* Animated Progress Arc */}
                        <AnimatedCircle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius}
                            stroke="url(#grad)"
                            strokeWidth={strokeWidth}
                            fill="none"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            strokeLinecap="round"
                            rotation="-90"
                            origin={`${size / 2}, ${size / 2}`}
                        />

                        {/* Inner Glow Circle */}
                        <Circle
                            cx={size / 2}
                            cy={size / 2}
                            r={radius - 15}
                            fill="rgba(0, 243, 255, 0.05)"
                        />
                    </Svg>

                    {/* Needle */}
                    <Animated.View style={[styles.needleContainer, { transform: [{ rotate: needleRotation }] }]}>
                        <View style={styles.needle} />
                    </Animated.View>

                    {/* Center Cap */}
                    <View style={styles.centerCap} />
                </View>

                {/* Text Branding */}
                <View style={styles.textContainer}>
                    <Text style={styles.brandText}>TRIP</Text>
                    <Text style={styles.modelText}>MATRIX</Text>
                </View>

            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
        alignItems: 'center',
        justifyContent: 'center',
    },
    content: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    gaugeContainer: {
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 30,
    },
    backgroundLogo: {
        position: 'absolute',
        width: '70%',
        height: '70%',
        opacity: 0.5,
        resizeMode: 'contain',
    },
    needleContainer: {
        position: 'absolute',
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
    },
    needle: {
        width: 4,
        height: 70, // Length of needle
        backgroundColor: '#00f3ff',
        borderRadius: 2,
        position: 'absolute',
        top: 10, // Offset from top to center pivot
        shadowColor: "#00f3ff",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
    },
    centerCap: {
        position: 'absolute',
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#00f3ff',
        borderWidth: 3,
        borderColor: '#000',
        zIndex: 10,
    },
    textContainer: {
        alignItems: 'center',
    },
    brandText: {
        color: '#00f3ff',
        fontSize: 20,
        letterSpacing: 6,
        marginBottom: 4,
        fontFamily: 'Orbitron_700Bold',
    },
    modelText: {
        color: 'white',
        fontSize: 28,
        letterSpacing: 2,
        fontFamily: 'Orbitron_400Regular',
    }
});
