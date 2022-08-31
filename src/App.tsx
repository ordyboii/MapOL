import { useEffect, useRef, useState } from "react";
import "ol/ol.css";
import "ol-layerswitcher/dist/ol-layerswitcher.css";
import type { Type } from "ol/geom/Geometry";
import { Map as OlMap, View } from "ol";
import { fromLonLat } from "ol/proj";
import {
  Group as LayerGroup,
  Tile as TileLayer,
  Vector as VectorLayer
} from "ol/layer";
import { OSM, Stamen, Vector as VectorSource } from "ol/source";
import LayerSwitcher from "ol-layerswitcher";
import { BaseLayerOptions, GroupLayerOptions } from "ol-layerswitcher";
import { Draw } from "ol/interaction";
import { FullScreen, defaults, ScaleLine } from "ol/control";
import { GeoJSON } from "ol/format";
import { Fill, Stroke, Style } from "ol/style";
import intersect from "@turf/intersect";
import buffer from "@turf/buffer";
import pointOnFeature from "@turf/point-on-feature";

const Map = () => {
  const turfCoors = "EPSG:4326";
  const openLayersCoors = "EPSG:3857";
  const mapRef = useRef<HTMLDivElement>(null);

  const [map, setMap] = useState<OlMap>();
  const [vectorSource, setVectorSource] = useState<VectorSource>();
  const [addressesSource, setAddressesSource] = useState<VectorSource>();
  const [draw, setDraw] = useState<Draw>();
  const [intersections, setIntersections] = useState(0);

  useEffect(() => {
    const osm = new TileLayer({
      title: "OSM",
      type: "base",
      visible: true,
      source: new OSM()
    } as BaseLayerOptions);

    const watercolor = new TileLayer({
      title: "Watercolor",
      type: "base",
      visible: false,
      source: new Stamen({
        layer: "watercolor"
      })
    } as BaseLayerOptions);

    const watercolorWithLabels = new LayerGroup({
      title: "Watercolor with labels",
      combine: true,
      visible: false,
      layers: [
        new TileLayer({
          source: new Stamen({
            layer: "watercolor"
          })
        }),
        new TileLayer({
          source: new Stamen({
            layer: "terrain-labels"
          })
        } as BaseLayerOptions)
      ]
    } as GroupLayerOptions);

    const baseMaps = new LayerGroup({
      title: "Basemaps",
      layers: [osm, watercolor, watercolorWithLabels]
    } as GroupLayerOptions);

    const vector = new VectorSource({ wrapX: false });
    setVectorSource(vector);

    const addresses = new VectorSource({ wrapX: false });
    setAddressesSource(addresses);

    const overlays = new LayerGroup({
      title: "Overlays",
      fold: "open",
      visible: false,
      layers: [
        new VectorLayer({
          title: "Addresses",
          source: addresses,
          visible: false
        } as BaseLayerOptions),
        new VectorLayer({
          title: "Constraints",
          source: vector,
          visible: false
        } as BaseLayerOptions)
      ]
    } as GroupLayerOptions);

    const map = new OlMap({
      target: mapRef.current!,
      layers: [baseMaps, overlays],
      controls: defaults().extend([new FullScreen(), new ScaleLine()]),
      view: new View({
        center: fromLonLat([-2.4673, 52.6776]),
        zoom: 13
      })
    });
    setMap(map);

    const layerSwitcher = new LayerSwitcher({
      reverse: true,
      groupSelectStyle: "children"
    });
    map.addControl(layerSwitcher);

    return () => map.dispose();
  }, []);

  const startDrawing = (type: Type) => {
    const draw = new Draw({ source: vectorSource, type });
    setDraw(draw);
    map?.addInteraction(draw);
  };

  const undo = () => draw?.removeLastPoint();
  const stopDrawing = () => map?.removeInteraction(draw!);

  const remove = () => {
    setIntersections(0);
    vectorSource?.clear();
  };

  const addGeoJson = async () => {
    const format = new GeoJSON();

    const mapData = await import("./geojson");
    const features = format.readFeatures(mapData.default);
    const turfPolys = format.writeFeaturesObject(features);

    features.forEach(feature => {
      const turfPoly = format.writeFeatureObject(feature);

      const turfPoint = pointOnFeature(turfPoly);
      const address = format.readFeature(turfPoint);
      address.getGeometry()?.transform(turfCoors, openLayersCoors);
      addressesSource?.addFeature(address);

      for (let i = 0; i < features.length; i++) {
        const intersected = intersect(turfPoly, turfPolys.features[i]);

        if (intersected) {
          setIntersections(num => num + 1);
          const intersection = format.readFeature(intersected);

          intersection.getGeometry()?.transform(turfCoors, openLayersCoors);
          intersection.setStyle(
            new Style({
              fill: new Fill({ color: "rgb(255, 165, 0, 0.5)" })
            })
          );

          vectorSource?.addFeature(intersection);
        }
      }

      feature.getGeometry()?.transform(turfCoors, openLayersCoors);
      feature.setStyle(
        new Style({
          stroke: new Stroke({ color: "rgb(255, 0, 0)" }),
          fill: new Fill({ color: "rgba(255, 0, 0, 0)" })
        })
      );
    });

    vectorSource?.addFeatures(features);
  };

  const bufferAddresses = () => {
    const format = new GeoJSON();
    const addresses = addressesSource?.getFeatures();

    addresses?.forEach(address => {
      address.getGeometry()?.transform(openLayersCoors, turfCoors);
      const turfPoint = format.writeFeatureObject(address);

      const buffered = buffer(turfPoint, 0.2, { units: "miles" });

      const bufferedArea = format.readFeature(buffered);
      bufferedArea.getGeometry()?.transform(turfCoors, openLayersCoors);
      bufferedArea.setStyle(
        new Style({
          fill: new Fill({
            color: "rgba(60, 179, 113, 0.15)"
          }),
          stroke: new Stroke({
            color: "rgb(60, 179, 113)"
          })
        })
      );

      addressesSource?.addFeature(bufferedArea);
    });
  };

  return (
    <>
      <div ref={mapRef} style={{ width: "100%", height: "600px" }} />
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button onClick={() => startDrawing("MultiPolygon")}>
          Start drawing
        </button>
        <button onClick={stopDrawing}>Stop drawing</button>
        <button onClick={undo}>Undo</button>
        <button onClick={remove}>Remove all</button>
        <button onClick={addGeoJson}>Add GeoJson Data</button>
        <button onClick={bufferAddresses}>Buffer addresses</button>

        {intersections > 0 && <p>Intersected {intersections} times</p>}
      </div>
    </>
  );
};

export default function App() {
  return (
    <main>
      <h1>ReactOL map list</h1>
      <Map />
    </main>
  );
}
