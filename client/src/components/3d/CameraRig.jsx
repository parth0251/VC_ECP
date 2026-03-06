import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

export default function CameraRig({ autoRotate }) {
    const controlsRef = useRef();

    useFrame(() => {
        if (controlsRef.current && autoRotate) {
            controlsRef.current.autoRotate = true;
            controlsRef.current.autoRotateSpeed = 1.0;
        } else if (controlsRef.current) {
            controlsRef.current.autoRotate = false;
        }
    });

    return (
        <OrbitControls
            ref={controlsRef}
            enablePan={false}
            minDistance={3}
            maxDistance={10}
            maxPolarAngle={Math.PI / 2 - 0.05} // Don't go below ground
            makeDefault
        />
    );
}
