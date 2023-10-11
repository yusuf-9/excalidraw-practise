import { useEffect, useMemo, useRef, useState } from "react";
import Image from "./Capture.JPG";
import { Excalidraw } from "@excalidraw/excalidraw";

const resolvablePromise = () => {
    let resolve;
    let reject;
    const promise = new Promise((_resolve, _reject) => {
      resolve = _resolve;
      reject = _reject;
    });
    promise.resolve = resolve;
    promise.reject = reject;
    return promise;
  };

const VanillJsCode = () => {
    const [imageX, setImageX] = useState(0);
    const [imageY, setImageY] = useState(0);
    const [imageScale, setImageScale] = useState(1);
    const [drawingMode, setDrawingMode] = useState(false)
    const [startStyles, setStartStyles] = useState({ x: 0, y: 0, imgX: 0, imgY: 0, imgScale: 1, diagonal: 0, originOffetX: 0, originOffsetY: 0 });
    const startingExcalidrawPosition = useRef({x: 0, y: 0})
    const imageRef = useRef();
    const excalidrawRef = useRef(null)



    const handleTouchStart = (e) => {
        const touches = [...e.targetTouches];
        // pan
        if (touches.length === 1) {
            startingExcalidrawPosition.current = getExcalidrawPosition(excalidrawRef)
            setStartStyles(prev => ({
                ...prev,
                x: touches[0].clientX
                , y: touches[0].clientY, imgX: imageX, imgY: imageY
            }))
        } else if (touches.length === 2) {
            const initialDistance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);


            const { x, y, width, height } = e.target.getBoundingClientRect()
            const pinchriginX = ((touches[0].pageX + touches[1].pageX) / 2);
            const pinchriginY = ((touches[0].pageY + touches[1].pageY) / 2);
            const imageCenterX = x + (width / 2);
            const imageCenterY = y + (height / 2);
            const xOriginDiff = pinchriginX - imageCenterX;
            const yOriginDiff = pinchriginY - imageCenterY;


            setStartStyles(prev => ({
                ...prev,
                diagonal: initialDistance,
                imgScale: imageScale,
                originOffetX: xOriginDiff,
                originOffsetY: yOriginDiff
            }));
        }
    }

    const handleTouchMove = (e) => {
        const touches = [...e.targetTouches];

        // pan
        if (touches.length === 1) {
            if(drawingMode) return;
            const xOffset = touches[0].clientX - startStyles.x;
            const yOffset = touches[0].clientY - startStyles.y;
            setImageX(startStyles.imgX + xOffset)
            setImageY(startStyles.imgY + yOffset)
            updateExcalidrawCanvas(excalidrawRef, startingExcalidrawPosition.current, {xOffset, yOffset})
        } else if (touches.length === 2) {
            const newDistance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
            const difference = newDistance - startStyles.diagonal;
            const scale = Math.max(startStyles.imgScale + (Math.round(difference / 10) / 10), 0.5)
            setImageScale(scale)
        }
    }

    const isViewMode = drawingMode ? {} : {viewModeEnabled : true}

    return (
        <>
        <div className="image-container"
         onTouchStart={handleTouchStart}
         onTouchMove={handleTouchMove}
        >
            <div style={{
                zIndex: 1,
                position: "absolute",
                left: 0,
                top: 0,
                width: "100%",
                height: "100%"
            }}
            >
                <img
                    ref={imageRef}
                    style={{
                        height: "625px",
                        width: "auto",
                        position: "absolute",
                        // maxWidth: 'none',
                        // maxHeight: 'none',
                        left: `${imageX}px`,
                        top: `${imageY}px`,
                        transform: `scale(${imageScale})`,
                        touchAction: 'none',
                        zIndex: 1000
                    }}
                    src={Image}

                />
            </div>
            <div style={{pointerEvents: drawingMode ? "all" : "none", touchAction: drawingMode ? "auto" : "none", position: "relative", zIndex: "5", height: "100%", width: "100%"}}>

            <Excalidraw
               initialData={{
                appState: { viewBackgroundColor: "transparent",},
              }}
              {...isViewMode}
              onChange={(a, b) => {
                // console.log(a, b)
                console.log({zoom: b.zoom.value, imageScale})

              }}
              ref={excalidrawRef}
            />
            </div>
        </div>
        <button onClick={() => {
            setDrawingMode(prev => !prev)
        }}>
            Toggle drawing Mode
        </button>
        </>
    );
}

export default VanillJsCode


const updateExcalidrawCanvas = (excalidrawRef, startingPositions, newPositions) => {

    const sceneData = {
        appState: {
            scrollX: startingPositions.x + newPositions.xOffset,
            scrollY: startingPositions.y + newPositions.yOffset
        }
    }

    excalidrawRef.current.updateScene(sceneData)

}

const getExcalidrawPosition = (excalidrawRef) => {
    const {scrollX, scrollY} =  excalidrawRef.current.getAppState()
    return {
        x: scrollX,
        y: scrollY
    }
}