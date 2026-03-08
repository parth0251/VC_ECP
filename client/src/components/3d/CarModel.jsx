import React, { useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import useConfig3DStore from "../../store/config3DStore";

export default function CarModel({ modelPath, carType }) {
  const {
    selectedColor,
    selectedInterior,
    selectedWheels,
    selectedPackages,
    selectedTrim,
    selectedDriveOrientation,
  } = useConfig3DStore();
  // Gracefully handle missing models with a basic fallback if necessary,
  // but useGLTF will suspend. We rely on <Suspense> in the parent.
  // Note: For now, we'll try to load the model. If it fails, Drei will throw.
  // We'll catch it at the Scene level with an ErrorBoundary if needed.

  const { scene } = useGLTF(modelPath);

  // Clone the scene so we can mutate materials independently
  const clonedScene = useMemo(() => scene.clone(), [scene]);

  // Determine scale based on carType
  const scale = useMemo(() => {
    if (carType === "SUV") return [1.1, 1.3, 1.1]; // Taller and slightly wider
    if (carType === "Coupe") return [1.0, 0.95, 0.95]; // Lower, sportier
    return [1.0, 1.0, 1.0]; // Default Sedan
  }, [carType]);

  useEffect(() => {
    // Create an interior color based on selection (Black is default, can parse names like 'Tan', 'Red')
    let interiorHex = "#1a1a1a"; // default dark
    if (selectedInterior) {
      const intName = selectedInterior.name.toLowerCase();
      if (intName.includes("tan") || intName.includes("beige"))
        interiorHex = "#d2b48c";
      if (intName.includes("red")) interiorHex = "#5c1010";
      if (intName.includes("white")) interiorHex = "#e8e8e8";
      if (intName.includes("brown")) interiorHex = "#5c4033";
    }

    // Wheel tint based on name
    let wheelColor = "#ffffff"; // standard alloy
    let wheelRoughness = 0.2;
    if (selectedWheels) {
      const wName = selectedWheels.name.toLowerCase();
      if (wName.includes("black") || wName.includes("dark")) {
        wheelColor = "#222222";
        wheelRoughness = 0.5;
      } else if (wName.includes("chrome")) {
        wheelColor = "#ffffff";
        wheelRoughness = 0.05;
      }
    }

    // Check if sporty packages are added
    const isSport =
      selectedPackages.some(
        (p) =>
          p.name.toLowerCase().includes("sport") ||
          p.name.toLowerCase().includes("carbon"),
      ) ||
      (selectedTrim && selectedTrim.name.toLowerCase().includes("sport"));

    clonedScene.traverse((child) => {
      if (child.isMesh) {
        const matName = child.material?.name?.toLowerCase() || "";
        const nodeName = child.name?.toLowerCase() || "";

        // 1. Exterior Paint
        if (
          matName.includes("body") ||
          matName.includes("paint") ||
          nodeName.includes("body") ||
          matName.includes("carpaint")
        ) {
          if (!child.userData.originalMaterial)
            child.userData.originalMaterial = child.material.clone();

          child.material = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color(selectedColor.hex || selectedColor),
            metalness: 0.7,
            roughness: 0.1,
            clearcoat: 1.0,
            clearcoatRoughness: 0.05,
          });
        }

        // 2. Interior Materials (Seats, Leather, Dash)
        if (
          matName.includes("interior") ||
          matName.includes("seat") ||
          matName.includes("leather") ||
          matName.includes("dash") ||
          nodeName.includes("interior") ||
          nodeName.includes("seat")
        ) {
          if (!child.userData.originalMaterial)
            child.userData.originalMaterial = child.material.clone();

          // Modify existing material to tint it
          child.material = child.userData.originalMaterial.clone();
          if (child.material.color) {
            child.material.color.set(interiorHex);
          }
        }

        // 3. Wheels (Rims, Alloy)
        if (
          matName.includes("rim") ||
          matName.includes("alloy") ||
          matName.includes("wheel") ||
          nodeName.includes("rim")
        ) {
          // Ignore tires
          if (!matName.includes("tire") && !matName.includes("rubber")) {
            if (!child.userData.originalMaterial)
              child.userData.originalMaterial = child.material.clone();
            child.material = child.userData.originalMaterial.clone();
            if (child.material.color) {
              child.material.color.set(wheelColor);
              child.material.roughness = wheelRoughness;
            }
          }
        }

        // 4. Packages / Trims (Toggle spoiler/carbon parts if they exist in the model)
        if (
          nodeName.includes("spoiler") ||
          nodeName.includes("carbon") ||
          matName.includes("carbon")
        ) {
          child.visible = isSport;
        }
        // 5. Drive Orientation (Steering Wheel)
        if (
          nodeName.includes("steering") ||
          nodeName.includes("wheel_steer") ||
          matName.includes("steering")
        ) {
          if (child.userData.originalX === undefined) {
            child.userData.originalX = child.position.x;
          }

          const isRHD = selectedDriveOrientation === "RHD";

          // The car model center is X=0. LHD steering is usually placed at positive X (e.g. 0.3 or 0.4).
          // If it's constructed with X=0 locally and shifted via a parent, we should shift the parent instead.
          // But if we traverse all children, adding a flat offset could break relative positions.
          // To handle this robustly, we only shift the highest node with 'steering' in the name that is not a child of another 'steering' node.
          // Let's check if my parent is also a steering node:
          let isRootSteeringNode = true;
          let parent = child.parent;
          while (parent) {
            if ((parent.name || "").toLowerCase().includes("steering")) {
              isRootSteeringNode = false;
              break;
            }
            parent = parent.parent;
          }

          if (isRootSteeringNode) {
            // For the Ferrari or generic car, LHD implies X ~ 0.35. RHD implies X ~ -0.35.
            // We will mirror the X position directly if it's non-zero.
            // If it IS zero (meaning it relies on a higher-up offset we missed), we just apply a hardcoded shift.
            if (Math.abs(child.userData.originalX) < 0.05) {
              // It's locally centered, meaning we are moving a mesh that was placed by a bone or parent.
              // hardcode a physical 0.73 meter total translation (0.365 each way)
              child.position.x = child.userData.originalX + (isRHD ? -0.73 : 0);
            } else {
              // Standard mirroring
              child.position.x = isRHD
                ? -Math.abs(child.userData.originalX)
                : Math.abs(child.userData.originalX);
            }
          }
        }
      }
    });
  }, [
    selectedColor,
    selectedInterior,
    selectedWheels,
    selectedPackages,
    selectedTrim,
    selectedDriveOrientation,
    clonedScene,
  ]);

  return <primitive object={clonedScene} scale={scale} />;
}
