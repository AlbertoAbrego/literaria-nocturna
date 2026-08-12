const SKELETON_ROWS = 5;

const SKELETON_BAR_WIDTHS = ["w-3/4", "w-1/2", "w-1/3", "w-2/3"] as const;

function BookTableSkeleton() {
  return (
    <tbody>
      {Array.from({ length: SKELETON_ROWS }, (_, rowIndex) => (
        <tr key={rowIndex} className="animate-pulse">
          {SKELETON_BAR_WIDTHS.map((width, columnIndex) => (
            <td key={columnIndex} className="px-6 py-4">
              <div className={`h-4 rounded bg-[#252B36] ${width}`} />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}

export default BookTableSkeleton;
