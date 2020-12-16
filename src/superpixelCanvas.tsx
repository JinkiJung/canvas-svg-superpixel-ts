import { useRef } from "react";

const React = require("react");
const { useState, useEffect } = require("react");
const Snap = require("snapsvg-cjs");
const svgToPng = require("save-svg-as-png");

export enum AnnotationTag{
  EMPTY = "empty",
  DEANNOTATING = "deannotating",
}

export interface ITag {
  tag: string;
  superpixelId: number;
  area: number;
}

const defaultOpacity = 0.1;
const annotatedOpacity = 0.7;
const annotatingOpacity = 0.9;
const defaultLineWidth = 0;
const highlightLineWidth = 2;

export interface IPoint{
    x: number,
    y: number,
}

export interface IAnnotation{
    tag: string,
    color: string,
    index?: number,
}

export interface ICoordinates{
    gridWidth: number, 
    gridHeight: number, 
    canvasWidth: number, 
    canvasHeight: number,
}

export class Annotation implements IAnnotation {
    tag: string
    color: string
    index?: number

    constructor(tag: string, color: string, index?:number){
        this.tag = tag;
        this.color = color;
        this.index = index;
    }
}

export const number2SPId = (id: number): string => {
    return "sp" + id.toString();
}

export const SPId2number = (spId: string): number => {
    return spId.startsWith("sp") ? parseInt(spId.substr(2)) : -1;
}

const defaultAnnotation = (id: number) => new Annotation(AnnotationTag.EMPTY, AnnotationTag.EMPTY, id);

export const exportToPng = (canvasId: string, fileName: string, backgroundColor: string = "#000000", callback?: (fileName: string, content: string) => any) => {
    let fileNameSplit = fileName.split("/");
    let finalFileName = fileNameSplit[fileNameSplit.length - 1].split(".")[0] + ".png";

    if (callback){
        svgToPng.svgAsPngUri(document.getElementById(canvasId),
        finalFileName, {backgroundColor: backgroundColor}).then((uri: string) => callback(finalFileName, uri));
    } else {
        svgToPng.saveSvgAsPng(document.getElementById(canvasId), finalFileName, {backgroundColor: backgroundColor})
    }
}

export const exportToSvg = (id: string, fileName: string, callback?: (fileName: string, content: string) => any) => {
    let fileNameSplit = fileName.split("/");
    let finalFileName = fileNameSplit[fileNameSplit.length - 1].split(".")[0] + ".svg";

    if (callback){
        const uri = "data:image/svg+xml;utf8,"+ document.getElementById(id)?.outerHTML!;
        callback(finalFileName, uri);
    } else {
        console.log(document.getElementById(id)?.outerHTML!);
    }
}

export const getSvgUrl = (canvasId:string): string => {
    const content = document.getElementById(canvasId)?.outerHTML!;
    var file = new Blob([content], { type: 'image/svg+xml' });
    return URL.createObjectURL(file);
}

interface SuperpixelCanvasProps {
    id: string, canvasWidth: number, canvasHeight: number, segmentationData: any,
     annotatedData: Annotation[], defaultcolor: string, annotating: Annotation,
     onSegmentsUpdated: (...params: any[]) => void, onSelectedTagUpdated: (...params: any[]) => void;
}

export const SuperpixelCanvas: React.FC<SuperpixelCanvasProps> = 
({id, canvasWidth, canvasHeight, segmentationData, annotatedData, defaultcolor,
     annotating, onSegmentsUpdated, onSelectedTagUpdated}) => {
    const [ segmentation, setSegmentation] = useState(segmentationData);
    const [ annotated, setAnnotated] = useState(annotatedData);
    const canvasRef = useRef<SVGSVGElement>(null);
    if(segmentationData && segmentationData !== segmentation){
        setSegmentation(segmentationData);
    }
    useEffect(() => {
        var s = Snap("#" + id);
        if (s.selectAll("path").length){
            s.clear();
        }
        // create superpixels
        const keys: number[] = [];
        if (keys.length === 0) {
            for (let k in segmentationData) keys.push(parseInt(k));
        }
        keys.map(key => {
            const annotation = annotatedData ? getAnnotationData(
                key,
                annotatedData,
                defaultAnnotation(key),
            ) : defaultAnnotation(key);
            const pixels = segmentationData[String(key)].split(",");
            const superpixel = s.path(
                getPathFromPoints(
                    pixels,
                    canvasWidth,
                    canvasHeight));
            superpixel.attr({ id: number2SPId(key), key, stroke: "white", strokeWidth: defaultLineWidth,
            fill: annotation.color === AnnotationTag.EMPTY ? defaultcolor : annotation.color,
            opacity: annotation.tag === AnnotationTag.EMPTY ? defaultOpacity : annotatedOpacity,
            tag: annotation.tag,
            name: annotation.color,
            area: pixels.length });
            superpixel.mouseover( () => {
              if(canvasRef && canvasRef.current){
                const annotatingTag = canvasRef.current.getAttribute("color-profile");
                const currentColor = superpixel.attr().name;
                const fillColor = canvasRef.current.getAttribute("name")!;
                if( annotatingTag !== AnnotationTag.EMPTY ){
                    canvasRef.current.setAttribute("content-script-type", currentColor); // storing color
                    updateSuperpixelSVG(superpixel,
                         annotatingTag === AnnotationTag.DEANNOTATING ? defaultcolor : fillColor,
                         annotatingTag === AnnotationTag.DEANNOTATING ? defaultOpacity : annotatingOpacity,
                         highlightLineWidth);
                    }
              }                
                })
                .mouseout( () => {
                  if(canvasRef && canvasRef.current){
                    const annotatingTag = canvasRef.current.getAttribute("color-profile");
                    const currentColor = superpixel.attr().name;
                    if(annotatingTag !== AnnotationTag.EMPTY){
                        const backupColor: string = canvasRef.current.getAttribute("content-script-type")!;
                        updateSuperpixelSVG(superpixel,
                            backupColor === AnnotationTag.EMPTY ? defaultcolor : backupColor,
                            currentColor === AnnotationTag.EMPTY ? defaultOpacity : annotatedOpacity,
                            defaultLineWidth);
                        }
                      }
                })
                .mousemove( (event: MouseEvent) => {
                    paintAndUpdateState(event, superpixel, defaultcolor, onSegmentsUpdated);
                })
                .mousedown( (event: MouseEvent) => {
                    paintAndUpdateState(event, superpixel, defaultcolor, onSegmentsUpdated);
                })
                .mouseup( (event: MouseEvent) => {
                    const tag: string = superpixel.attr()["tag"];
                    onSelectedTagUpdated(tag);
                });
            return superpixel;
        });
    }, [segmentation, annotated]);
    const viewBoxString = [0, 0, canvasWidth, canvasHeight].join(
        " "
    );
    return (<svg xmlnsXlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" width={canvasWidth} height={canvasHeight} key={id} ref={canvasRef} id={id} colorProfile={annotating?.tag} name={annotating?.color} viewBox={viewBoxString}></svg>);
}

const getAnnotationData = (
    key: number,
    annotatedData: Annotation[],
    defaultAnnotating: Annotation
): Annotation => {
    for (const e of annotatedData) {
        if (e.index === key) return e;
    }
    return defaultAnnotating;
};

export const getBoundingBox = (canvasId: string, ids: number[]) => {
    let pathString = "";
    ids.map( (id) => {const s = document.getElementById("sp"+id)!; pathString += (s.getAttribute("d") + " ") });
    const s = Snap("#"+canvasId);
    const path = s.path(pathString);
    //path.attr( {visibility: "hidden"} );
    const bbox = path.getBBox();
    path.remove();
    return { left: bbox.x, top: bbox.y, width: bbox.width, height: bbox.height };
}

function getPathFromPoints(points: any, canvasWidth: number, canvasHeight :number){
    const gridWidth = canvasWidth + 1;
    const gridHeight = canvasHeight + 1;
    if(points===undefined || points.length===0)
        return undefined;
    var currentPoint= convertImg2Grid(parseInt(points[0]), canvasWidth, gridWidth);
    const startPoint = currentPoint;
    var pathString = "M "+convert2Point(currentPoint, gridWidth).join(" ")+" ";
    var traverseDirection = Direction.RIGHT;
    var count = 0;
    var coordinates = {gridWidth: gridWidth, gridHeight: gridHeight, canvasWidth: canvasWidth, canvasHeight: canvasHeight};
    do{       
        if (traverseDirection === Direction.RIGHT && checkMembership(points, addOffset(currentPoint, [0, -1], gridWidth), coordinates)){
            traverseDirection = (traverseDirection + 3 ) % 4;
            [ pathString, currentPoint ] = stepForward(currentPoint, traverseDirection, pathString, gridWidth);
        } else if (traverseDirection === Direction.RIGHT && checkMembership(points, currentPoint, coordinates)){
            [ pathString, currentPoint ] = stepForward(currentPoint, Direction.RIGHT, pathString, gridWidth);
        } else if (traverseDirection === Direction.DOWN && checkMembership(points, currentPoint, coordinates)){
            traverseDirection = (traverseDirection + 3 ) % 4;
            [ pathString, currentPoint ] = stepForward(currentPoint, traverseDirection, pathString, gridWidth);
        } else if (traverseDirection === Direction.DOWN && checkMembership(points, addOffset(currentPoint, [-1, 0], gridWidth), coordinates)){ 
            [ pathString, currentPoint ] = stepForward(currentPoint, Direction.DOWN, pathString, gridWidth);
        } else if (traverseDirection === Direction.LEFT && checkMembership(points, addOffset(currentPoint, [-1, 0], gridWidth), coordinates)){ 
            traverseDirection = (traverseDirection + 3 ) % 4;
            [ pathString, currentPoint ] = stepForward(currentPoint, traverseDirection, pathString, gridWidth);
        } else if (traverseDirection === Direction.LEFT && checkMembership(points, addOffset(currentPoint, [-1, -1], gridWidth), coordinates)){ 
            [ pathString, currentPoint ] = stepForward(currentPoint, Direction.LEFT, pathString, gridWidth);
        } else if (traverseDirection === Direction.UP && checkMembership(points, addOffset(currentPoint, [-1, -1], gridWidth), coordinates)){ 
            traverseDirection = (traverseDirection + 3 ) % 4;
            [ pathString, currentPoint ] = stepForward(currentPoint, traverseDirection, pathString, gridWidth);
        } else if (traverseDirection === Direction.UP && checkMembership(points, addOffset(currentPoint, [0, -1], gridWidth), coordinates)){ 
            [ pathString, currentPoint ] = stepForward(currentPoint, Direction.UP, pathString, gridWidth);
        } else {
            traverseDirection = (traverseDirection + 1 ) % 4;
        }
        count += 1;
    } while(currentPoint !== startPoint && count < 1000);
    return pathString + "Z";
}


const Direction = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
}

const addOffset = (point: number, offset: number[], gridWidth: number): number => {
    return point + offset[0] + (offset[1] * gridWidth);
}

const convertGrid2Img = (index: number, gridWidth: number, canvasWidth: number): number => {
    return index % gridWidth + Math.floor(index / gridWidth) * canvasWidth;
}

const convertImg2Grid = (index: number, canvasWidth: number, gridWidth: number): number => {
    return index % canvasWidth + Math.floor(index / canvasWidth) * gridWidth;
}

function moveAlongDirection(point: number, direction: number, gridWidth: number){
    switch (direction){
        case Direction.UP:
            return addOffset(point, [0, -1], gridWidth);
        case Direction.DOWN:
            return addOffset(point, [0, 1], gridWidth);
        case Direction.LEFT:
            return addOffset(point, [-1, 0], gridWidth);
        case Direction.RIGHT:
            return addOffset(point, [1, 0], gridWidth);
        default:
            return point;
    }
}

function checkMembership(points: string[], gridPoint: number, coordinates: ICoordinates){
    if(gridPoint < 0 || gridPoint % coordinates.gridWidth >= coordinates.canvasWidth || Math.floor(gridPoint / coordinates.gridWidth) >= coordinates.canvasHeight) // exclude grid edges
        return false;
    else
        return points.includes(String(convertGrid2Img(gridPoint, coordinates.gridWidth, coordinates.canvasWidth)));
}

function convert2Point(index: number, gridWidth: number){
    return [ index%gridWidth, Math.floor(index/gridWidth) ];
}

const stepForward = (currentPoint: number, direction: number, pathString: string, gridWidth: number): [ string, number ] => {
    let newPoint = moveAlongDirection(currentPoint, direction, gridWidth);
    let newPathString = pathString + "L "+ convert2Point(newPoint, gridWidth).join(" ")+" ";
    return [ newPathString,  newPoint ];
}

const updateSuperpixelSVG = (component: Snap.Element, fill: string, opacity: number, strokeWidth: number, tag?: string, color?: string ) => {
    if (tag && color){
        component.attr({...component.attr, fill, opacity, strokeWidth, tag, name: color,});
    }
    else{
        component.attr({...component.attr, fill, opacity, strokeWidth, });
    }
}

const paintAndUpdateState = (event: MouseEvent, superpixel: any, defaultcolor: string, onSegmentsUpdated: ISegmentsCallback) => {
    const annotatingTag = superpixel.parent().attr()["color-profile"];
    if(event.buttons === 1 && annotatingTag !== AnnotationTag.EMPTY){
        const fillColor: string = superpixel.parent().attr()["name"];
        paintSuperpixel(superpixel, annotatingTag, fillColor, parseInt(superpixel.attr()["area"]), onSegmentsUpdated);
        superpixel.parent().attr({...superpixel.parent().attr(), "content-script-type": fillColor}); // storing color
    }
    else if(event.buttons === 2 && annotatingTag !== AnnotationTag.EMPTY){ // removing
        clearSuperpixel(superpixel, defaultcolor, parseInt(superpixel.attr()["area"]), onSegmentsUpdated); // area should be updated
        superpixel.parent().attr({...superpixel.parent().attr(), "content-script-type": defaultcolor}); // storing color
    }
};

type ISegmentsCallback = (segments: ITag[]) => void;

export const paintSuperpixel =
        (snapElement: Snap.Paper, tag: string, color: string, area: number, onSegmentsUpdated: ISegmentsCallback) => {
    if (tag === AnnotationTag.EMPTY || color === AnnotationTag.EMPTY) {
        return ;
    }
    if (snapElement){
        const coloringTag = tag === AnnotationTag.DEANNOTATING ? AnnotationTag.EMPTY : tag;
        updateSuperpixelSVG(snapElement, color, coloringTag === AnnotationTag.EMPTY ? defaultOpacity : annotatedOpacity,
            defaultLineWidth, coloringTag, tag === AnnotationTag.DEANNOTATING ? AnnotationTag.EMPTY : color);
            onSegmentsUpdated([{tag, area, superpixelId: SPId2number(snapElement.attr("id")) }]);
    }
    else{
        console.log("ERROR: a superpixel was not able to find!");
    }
}

export const clearEditor = (canvasId: string, defaultcolor: string) => {
    const s = Snap("#"+canvasId);
    const paths = s.selectAll('path');
    paths.forEach(function(element: Snap.Set){
        const e = element.attr;
        element.attr({... e, name: AnnotationTag.EMPTY, tag: AnnotationTag.EMPTY, fill: defaultcolor, style: "stroke-width: 1; opacity: 0.1;", });
    }, this);
}

const clearSuperpixel = (snapElement: Snap.Paper, defaultcolor: string, area: number, onSegmentsUpdated: ISegmentsCallback) => {
    paintSuperpixel(snapElement, AnnotationTag.DEANNOTATING, defaultcolor, area, onSegmentsUpdated);
}