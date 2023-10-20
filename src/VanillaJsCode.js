import { useEffect, useMemo, useRef, useState } from "react";
import Image from "./Capture.JPG";
import { Excalidraw } from "@excalidraw/excalidraw";


const VanillJsCode = () => {
    const [imageX, setImageX] = useState(0);
    const [imageY, setImageY] = useState(0);
    const [imageScale, setImageScale] = useState(1);
    const [drawingMode, setDrawingMode] = useState(false)
    const [startStyles, setStartStyles] = useState({ x: 0, y: 0, imgX: 0, imgY: 0, imgScale: 1, diagonal: 0, originOffetX: 0, originOffsetY: 0 });
    const startingExcalidrawPosition = useRef({ x: 0, y: 0 })
    const imageRef = useRef();
    const imageCoords = useRef();
    const excalidrawRef = useRef(null);



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
            if (drawingMode) return;
            const xOffset = touches[0].clientX - startStyles.x;
            const yOffset = touches[0].clientY - startStyles.y;
            setImageX(startStyles.imgX + xOffset)
            setImageY(startStyles.imgY + yOffset)
            updateExcalidrawCanvas(excalidrawRef, startingExcalidrawPosition.current, { xOffset: xOffset / imageScale, yOffset: yOffset / imageScale }, imageScale)
            imageCoords.current = null
        } else if (touches.length === 2) {
            const newDistance = Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);
            const difference = newDistance - startStyles.diagonal;
            const factor = (Math.max(startStyles.imgScale + (Math.round(difference / 10) / 10), 0.5)) - imageScale
            const pinchriginX = ((touches[0].pageX + touches[1].pageX) / 2);
            const pinchriginY = ((touches[0].pageY + touches[1].pageY) / 2);
            const pinchCoords = {
                x: pinchriginX,
                y: pinchriginY
            } 

            handleScaleImage(factor, pinchCoords, false)
        }
    }

    const handleScaleCenter = (factor) => {


        const containerCoords = document.querySelector(".image-container")?.getBoundingClientRect()
        const containerCenter = {
            x: containerCoords.left + (containerCoords.width / 2),
            y: containerCoords.top + (containerCoords.height / 2),
        }

        handleScaleImage(factor, containerCenter, true)
    }

    const handleScaleImage = (factor, containerCenter, zoomAtCenter = true) => {

        if ((imageScale <= 1 && factor === -0.1)) return;

        const appState = excalidrawRef.current.getAppState();



        if (imageScale !== appState.zoom.value) {
            const appLayerX = containerCenter.x - appState.offsetLeft;
            const appLayerY = containerCenter.y - appState.offsetTop;

            // console.log(imageScale - appState.zoom.value, "scales one")

            // get scroll offsets for target zoom level
            const zoomOffsetScrollX = -(
                appLayerX -
                appLayerX / (imageScale) -
                (appLayerX - appLayerX / appState.zoom.value)
            );
            const zoomOffsetScrollY = -(
                appLayerY -
                appLayerY / (imageScale) -
                (appLayerY - appLayerY / appState.zoom.value)
            );

            excalidrawRef.current.updateScene({
                appState: {
                    scrollX: appState.scrollX + zoomOffsetScrollX,
                    scrollY: appState.scrollY + zoomOffsetScrollY,
                    zoom: {
                        value: imageScale,
                    },
                },
            });
        }

        if (imageScale === appState.zoom.value) {



            if (!zoomAtCenter || (zoomAtCenter && !imageCoords.current)) {
                imageCoords.current = { coords: imageRef.current?.getBoundingClientRect(), scale: imageScale };
            }

            const imageCenter = {
                x: imageCoords.current.coords.left + (imageCoords.current.coords.width / 2),
                y: imageCoords.current.coords.top + (imageCoords.current.coords.height / 2),
            };

            const translateX = ((imageCenter.x - containerCenter.x) / imageCoords.current.scale) * factor;
            const translateY = ((imageCenter.y - containerCenter.y) / imageCoords.current.scale) * factor;

            setImageX(prev => prev + translateX)
            setImageY(prev => prev + translateY)




            const appLayerX = containerCenter.x - appState.offsetLeft;
            const appLayerY = containerCenter.y - appState.offsetTop;

            // get scroll offsets for target zoom level
            const zoomOffsetScrollX = -(
                appLayerX -
                appLayerX / (imageScale + factor) -
                (appLayerX - appLayerX / appState.zoom.value)
            );
            const zoomOffsetScrollY = -(
                appLayerY -
                appLayerY / (imageScale + factor) -
                (appLayerY - appLayerY / appState.zoom.value)
            );

            excalidrawRef.current.updateScene({
                appState: {
                    scrollX: appState.scrollX + zoomOffsetScrollX,
                    scrollY: appState.scrollY + zoomOffsetScrollY,
                    zoom: {
                        value: imageScale + factor,
                    },
                },
            });


            setImageScale(prev => prev + factor)
        }
    }

    const handleWheelZoom = (e) => {
        const factor = Math.sign(e.deltaY) < 0 ? 0.1 : -0.1;


        const pointerCoords = {
            x: e.clientX,
            y: e.clientY,
        }


        handleScaleImage(factor, pointerCoords, false);

        // if (imageScale <= 1 && factor === -0.1) return;


        // const pointerCoords = {
        //     x: e.clientX,
        //     y: e.clientY,
        // }



        // const appState = excalidrawRef.current.getAppState();

        // const appLayerX = pointerCoords.x - appState.offsetLeft;
        // const appLayerY = pointerCoords.y - appState.offsetTop;

        // console.log(appLayerX, appLayerY, "wheel applayers")

        // const currentZoom = appState.zoom.value;

        // // get scroll offsets for target zoom level
        // const zoomOffsetScrollX = -(
        //     appLayerX -
        //     appLayerX / (appState.zoom.value + factor) -
        //     (appLayerX - appLayerX / currentZoom)
        // );
        // const zoomOffsetScrollY = -(
        //     appLayerY -
        //     appLayerY / (appState.zoom.value + factor) -
        //     (appLayerY - appLayerY / currentZoom)
        // );

        // excalidrawRef.current.updateScene({
        //     appState: {
        //         scrollX: appState.scrollX + zoomOffsetScrollX,
        //         scrollY: appState.scrollY + zoomOffsetScrollY,
        //         zoom: {
        //             value: appState.zoom.value + factor,
        //         },
        //     },
        // });



        // // if (!imageCoords.current) {
        //     imageCoords.current = { coords: imageRef.current?.getBoundingClientRect(), scale: imageScale };
        // // }

        // const imageCenter = {
        //     x: imageCoords.current.coords.left + (imageCoords.current.coords.width / 2),
        //     y: imageCoords.current.coords.top + (imageCoords.current.coords.height / 2),
        // };

        // const translateX = ((imageCenter.x - pointerCoords.x) / imageCoords.current.scale) * factor;
        // const translateY = ((imageCenter.y - pointerCoords.y) / imageCoords.current.scale) * factor;

        // setImageX(prev => prev + translateX)
        // setImageY(prev => prev + translateY)

        // setImageScale(prev => prev + factor)

        // excalidrawRef.current.refresh()


    }

    const isViewMode = drawingMode ? {} : { viewModeEnabled: true }

    return (
        <>
            <div className="image-container"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onWheel={handleWheelZoom}
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
                <div style={{ pointerEvents: drawingMode ? "all" : "none", touchAction: drawingMode ? "auto" : "none", position: "relative", zIndex: "5", height: "100%", width: "100%" }}>

                    <Excalidraw
                        initialData={{
                            appState: { viewBackgroundColor: "transparent", scrollX: 0, scrollY: 0 },
                            scrollToContent: false,

                        }}
                        {...isViewMode}
                        onChange={(a, b) => {
                            // console.log(a, b)
                            // console.log({ zoom: b.zoom.value, imageScale })

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
            <button onClick={() => { handleScaleCenter(0.1) }}>Scale up</button>
            <button onClick={() => { handleScaleCenter(-0.1) }}>Scale down</button>
        </>
    );
}

export default VanillJsCode


const updateExcalidrawCanvas = (excalidrawRef, startingPositions, newPositions, zoom) => {

    const sceneData = {
        appState: {
            scrollX: startingPositions.x + newPositions.xOffset,
            scrollY: startingPositions.y + newPositions.yOffset,
            zoom: {
                value: zoom
            }
        }
    }

    excalidrawRef.current.updateScene(sceneData)

}

const getExcalidrawPosition = (excalidrawRef) => {
    const { scrollX, scrollY } = excalidrawRef.current.getAppState()
    return {
        x: scrollX,
        y: scrollY
    }
}