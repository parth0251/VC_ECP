import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, ContactShadows, Html, useProgress } from '@react-three/drei';
import CameraRig from './CameraRig';
import CarModel from './CarModel';
import useConfig3DStore from '../../store/config3DStore';

function Loader() {
    const { progress } = useProgress();
    return (
        <Html center>
            <div style={{ color: 'white', fontSize: '1.2rem', fontFamily: 'sans-serif', whiteSpace: 'nowrap' }}>
                {progress.toFixed(0)} % loaded
            </div>
        </Html>
    );
}

function ProceduralCar({ selectedColor, type }) {
    const { selectedDriveOrientation } = useConfig3DStore();

    // Colors and Materials common
    const bodyMat = <meshStandardMaterial color={selectedColor} metalness={0.8} roughness={0.2} />;
    const wheelMat = <meshStandardMaterial color="#111" roughness={0.9} />;
    const steeringMat = <meshStandardMaterial color="#333" roughness={0.7} />;

    // Wheels Geometry (shared)
    const wheelY = -0.4;
    const wheels = (
        <group>
            {/* Front Left */}
            <mesh position={[1.3, wheelY, 0.95]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 32]} />
                {wheelMat}
            </mesh>
            {/* Front Right */}
            <mesh position={[1.3, wheelY, -0.95]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 32]} />
                {wheelMat}
            </mesh>
            {/* Rear Left */}
            <mesh position={[-1.3, wheelY, 0.95]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 32]} />
                {wheelMat}
            </mesh>
            {/* Rear Right */}
            <mesh position={[-1.3, wheelY, -0.95]} rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.2, 32]} />
                {wheelMat}
            </mesh>
        </group>
    );

    // Steering Wheel Geometry
    const isLHD = selectedDriveOrientation === 'LHD';
    const steeringWheelX = isLHD ? 0.6 : -0.6;
    const steeringWheel = (
        <group position={[steeringWheelX, 0.4, 0.5]} rotation={[Math.PI / 8, 0, 0]}>
            <mesh castShadow>
                <torusGeometry args={[0.2, 0.04, 16, 32]} />
                {steeringMat}
            </mesh>
            <mesh rotation={[Math.PI / 2, 0, 0]} castShadow>
                <cylinderGeometry args={[0.02, 0.02, 0.4]} />
                {steeringMat}
            </mesh>
        </group>
    );

    if (type === 'SUV') {
        return (
            <group position={[0, 0.6, 0]}>
                {/* Lower Body */}
                <mesh position={[0, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[4.4, 1.0, 1.9]} />
                    {bodyMat}
                </mesh>
                {/* Upper Cabin */}
                <mesh position={[-0.2, 0.9, 0]} castShadow receiveShadow>
                    <boxGeometry args={[3.2, 0.8, 1.7]} />
                    {bodyMat}
                </mesh>
                <group position={[0.5, 0.6, 0]}>
                    {steeringWheel}
                </group>
                {wheels}
            </group>
        );
    }

    if (type === 'Coupe') {
        return (
            <group position={[0, 0.3, 0]}>
                {/* Lower Body */}
                <mesh position={[0, 0, 0]} castShadow receiveShadow>
                    <boxGeometry args={[4.2, 0.7, 1.8]} />
                    {bodyMat}
                </mesh>
                {/* Sloping Cabin */}
                <mesh position={[-0.4, 0.65, 0]} castShadow receiveShadow>
                    <boxGeometry args={[2.0, 0.5, 1.5]} />
                    {bodyMat}
                </mesh>
                <group position={[0.2, 0.4, 0]}>
                    {steeringWheel}
                </group>
                {wheels}
            </group>
        );
    }

    // Default: Sedan (3-box design)
    return (
        <group position={[0, 0.4, 0]}>
            {/* Lower Body */}
            <mesh position={[0, 0, 0]} castShadow receiveShadow>
                <boxGeometry args={[4.4, 0.8, 1.8]} />
                {bodyMat}
            </mesh>
            {/* Middle Cabin */}
            <mesh position={[-0.1, 0.7, 0]} castShadow receiveShadow>
                <boxGeometry args={[2.4, 0.6, 1.6]} />
                {bodyMat}
            </mesh>
            <group position={[0.4, 0.4, 0]}>
                {steeringWheel}
            </group>
            {wheels}
        </group>
    );
}

export default function CarScene({ modelPath, selectedColor, carType, autoRotate = true }) {
    return (
        <Canvas shadows dpr={[1, 2]} camera={{ position: [0, 1.5, 6], fov: 50 }}>
            {/* Lighting & Environment */}
            <ambientLight intensity={0.5} />
            <spotLight position={[10, 15, 10]} angle={0.3} penumbra={1} castShadow intensity={2} shadowBias={-0.0001} />
            <Environment preset="city" background={false} />

            <Suspense fallback={<Loader />}>
                {modelPath ? (
                    <CarModel modelPath={modelPath} carType={carType || 'Sedan'} />
                ) : (
                    <ProceduralCar selectedColor={selectedColor} type={carType || 'Sedan'} />
                )}
            </Suspense>

            {/* Ground Shadow */}
            <ContactShadows resolution={1024} scale={10} blur={2} opacity={0.4} far={10} color="#000000" />

            <CameraRig autoRotate={autoRotate} />
        </Canvas>
    );
}
