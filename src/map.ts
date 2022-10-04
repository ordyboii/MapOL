import { RefObject, useEffect, useState } from "react";
import { Map, View } from "ol";
import { Tile as TileLayer, Vector as VectorLayer } from "ol/layer";
import { OSM, Vector as VectorSource } from "ol/source";
import { fromLonLat } from "ol/proj";
import { Control, defaults, FullScreen, ScaleLine } from "ol/control";
import { GeoJSON } from "ol/format";
import { Draw, Snap } from "ol/interaction";
import { BaseLayerOptions } from "ol-layerswitcher";
import LayerSwitcher from "ol-layerswitcher";

const masterMapUrl = "https://www.planning.data.gov.uk/entity/44001294.geojson";
const parish = "https://www.planning.data.gov.uk/entity/130000858.geojson";
const ancientWoodland =
  "https://www.planning.data.gov.uk/entity/110032538.geojson";
const scientificInterest =
  "https://www.planning.data.gov.uk/entity/14501548.geojson";

export const useMap = (mapRef: RefObject<HTMLElement>) => {
  const [map, setMap] = useState<Map | null>(null);
  const [editLayer, setEditLayer] = useState<VectorLayer<VectorSource> | null>(
    null
  );

  useEffect(() => {
    if (mapRef.current) {
      const baseMap = new TileLayer({
        source: new OSM()
      });

      const masterMap = new VectorLayer({
        title: "Master Map",
        source: new VectorSource({
          format: new GeoJSON(),
          url: masterMapUrl
        }),
        style: {
          "stroke-color": "hsl(0 0% 0%)",
          "stroke-width": 2,
          "fill-color": "hsl(0 0% 0% / 0.1)"
        }
      } as BaseLayerOptions);

      const editLayer = new VectorLayer({
        title: "Edit Layer",
        source: new VectorSource(),
        style: {
          "fill-color": "rgba(255, 0, 0, 0.3)",
          "stroke-color": "rgba(255, 0, 0, 0.9)",
          "stroke-width": 2
        }
      } as BaseLayerOptions);
      setEditLayer(editLayer);

      const parishLayer = new VectorLayer({
        title: "Parishes",
        source: new VectorSource({
          format: new GeoJSON(),
          url: parish
        }),
        style: {
          "stroke-color": "hsl(215 100% 50%)",
          "stroke-width": 2,
          "fill-color": "hsl(215 100% 50% / 0.1)"
        }
      } as BaseLayerOptions);

      const scientificLayer = new VectorLayer({
        title: "Sites of Scientific Interest",
        source: new VectorSource({
          format: new GeoJSON(),
          url: scientificInterest
        }),
        style: {
          "stroke-color": "hsl(172 100% 50%)",
          "stroke-width": 2,
          "fill-color": "hsl(172 100% 50% / 0.1)"
        }
      } as BaseLayerOptions);

      const ancientWoodlandLayer = new VectorLayer({
        title: "Ancient Woodland",
        source: new VectorSource({
          format: new GeoJSON(),
          url: ancientWoodland
        }),
        style: {
          "stroke-color": "hsl(118 100% 35%)",
          "stroke-width": 2,
          "fill-color": "hsl(118 100% 35% / 0.1)"
        }
      } as BaseLayerOptions);

      const layerSwitcher = new LayerSwitcher({
        groupSelectStyle: "children"
      });

      const fullScreen = new FullScreen();
      const scaleLine = new ScaleLine();

      const drawButton = document.createElement("button");
      drawButton.innerHTML = "Draw";
      drawButton.className = "draw";

      drawButton.addEventListener("click", () => {
        map.addInteraction(draw);
        map.addInteraction(snap);
      });

      const drawControl = new Control({
        element: drawButton
      });

      const snap = new Snap({
        source: masterMap.getSource()!
      });

      const draw = new Draw({
        type: "MultiPolygon",
        source: editLayer.getSource()!,
        trace: true,
        traceSource: masterMap.getSource()!,
        style: {
          "stroke-color": "rgba(100, 255, 0, 1)",
          "stroke-width": 2,
          "fill-color": "rgba(100, 255, 0, 0.3)",
          "circle-radius": 6,
          "circle-fill-color": "rgba(100, 255, 0, 1)"
        }
      });

      const map = new Map({
        target: mapRef.current,
        layers: [
          baseMap,
          parishLayer,
          scientificLayer,
          ancientWoodlandLayer,
          masterMap,
          editLayer
        ],
        controls: defaults().extend([
          layerSwitcher,
          fullScreen,
          scaleLine,
          drawControl
        ]),
        view: new View({
          center: fromLonLat([-2.4673, 52.6776]),
          zoom: 13
        })
      });
      setMap(map);

      return () => map.dispose();
    }
  }, []);

  return { map, editLayer };
};
