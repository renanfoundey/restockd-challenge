import { Warehouse } from "@/lib/types";

export const warehouses: Warehouse[] = [
  {
    id: "WH-EAST-01",
    name: "East Distribution Center",
    location: "Newark, NJ",
    capacity: 50000,
  },
  {
    id: "WH-WEST-01",
    name: "West Coast Hub",
    location: "Ontario, CA",
    capacity: 75000,
  },
  {
    id: "WH-CENT-01",
    name: "Central Fulfillment",
    location: "Dallas, TX",
    capacity: 40000,
  },
  {
    id: "WH-NRTH-01",
    name: "Northern Depot",
    location: "Chicago, IL",
    capacity: 35000,
  },
];
