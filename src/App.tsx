import { useRef, useState } from "react";
import { useMap } from "./map";
import type { Feature } from "ol";
import { Vector as VectorLayer } from "ol/layer";
import { GeoJSON } from "ol/format";
import { Fill, Stroke, Style } from "ol/style";
import intersect from "@turf/intersect";

export default function App() {
  const mapRef = useRef(null);
  const [intersections, setIntersections] = useState(0);
  const { editLayer, map } = useMap(mapRef);

  editLayer?.getSource()?.on("addfeature", () => {
    const format = new GeoJSON();
    const turfPolygon = format.writeFeaturesObject(
      editLayer.getSource()?.getFeatures()!
    );

    map?.getAllLayers().forEach(layer => {
      if (layer instanceof VectorLayer) {
        layer
          .getSource()
          ?.getFeatures()
          .forEach((feature: Feature) => {
            const turfFeature = format.writeFeatureObject(feature);
            const intersected = intersect(
              turfPolygon.features[0].geometry,
              turfFeature?.geometry
            );
            if (intersected) {
              setIntersections(i => i + 1);
              const polygon = format.readFeature(intersected);

              polygon.getGeometry()?.transform("EPSG:4326", "EPSG:3857");
              polygon.setStyle(
                new Style({
                  fill: new Fill({
                    color: "red"
                  }),
                  stroke: new Stroke({
                    color: "red",
                    width: 2
                  })
                })
              );
              editLayer.getSource()?.addFeature(polygon);
            }
          });
      }
    });
  });

  return (
    <main>
      <h1>Map example</h1>
      <div ref={mapRef} className='map'></div>
      <p>{intersections} intersections</p>
    </main>
  );
}
