export interface Station {
  name: string;
  line: string;
  color: string;
  lat: number;
  lng: number;
}

export interface ArrivalInfo {
  time: number;
  delay: number;
}

export interface StopEstacion {
  stop_name: string;
  arrival: ArrivalInfo;
}

export interface LineaInfo {
  Route_Id: string;
  Direction_ID: number;
  Estaciones: StopEstacion[];
}

export interface SubteEntity {
  Linea: LineaInfo;
}

export interface SubteApiResponse {
  Entity: SubteEntity[];
}

export interface DelayInfo {
  label: string;
  cls: string;
}

export interface NearestResult {
  station: Station;
  distance: number;
}

export interface RelevantTrip {
  entity: SubteEntity;
  stop: StopEstacion;
}

export interface ActiveFormation {
  id: string;
  line: string;
  direction: number;
  stationName: string;
  stationIndex: number;
  totalStations: number;
  progress: number;
  updatedAt: number;
}

export interface FormationsResponse {
  formations: ActiveFormation[];
  lastPoll: number;
}
