import Skeleton from "@/shared/components/ui/Skeleton";
import { TableBody, TableCell, TableRow } from "@/shared/components/ui/Table";

const SKELETON_ROWS = 5;

const SKELETON_BAR_WIDTHS = ["w-3/4", "w-1/2", "w-1/3", "w-2/3"] as const;

function BookTableSkeleton() {
  return (
    <TableBody>
      {Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
        <TableRow key={rowIndex}>
          {SKELETON_BAR_WIDTHS.map((width, columnIndex) => (
            <TableCell key={columnIndex}>
              <Skeleton className={width} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </TableBody>
  );
}

export default BookTableSkeleton;
