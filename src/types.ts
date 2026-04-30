export interface Route {
  route_id: string;
  route_desc: string;
  route_type: number;
}

export interface Stop {
  stop_id: string;
  stop_name: string;
  stop_lat: number;
  stop_lon: number;
  location_type: number | null;
}

// export interface ShortestPath {
//   message: string;
//   stops: Stop[];
// }

export interface Trip{
  route_id: string;
  service_id:string;
  trip_id:string;
}
export interface StopTime{
  arrival_time:string;
  departure_time:string;
  stop_id:string;
  stop_sequence:number;
  trip_id:string
}
export interface RouteStop {
  latitude: number;
  longitude: number;
  stop_id: string;
  stop_name: string;
}
export interface RouteResponse {
  estimated_duration: string;
  path_coords_list: [number, number][][];
  stops_with_details: RouteStop[];
  total_distance: string;
}

export interface RouteDetails {
  route_id: string;
  response: RouteResponse;
}

export interface ShortestPath {
  message: string;
  stops: Stop[];
}
export interface StopRoutesResponse {
  stop_id: string;
  routes: {
    route_id: string;
    route_desc: string;
  }[];
}