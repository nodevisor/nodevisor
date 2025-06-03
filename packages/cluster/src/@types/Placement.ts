import type PlacementType from '../constants/PlacementType';

type Placement =
  | PlacementType
  | {
      type: PlacementType;
      constraints?: string[];
    };

export default Placement;
