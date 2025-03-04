const StatsCard = ({ title, value, icon, trend }) => {
  return (
    <div className="rounded-xl border border-s4/25 bg-s2 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-p3 mb-2">{title}</p>
          <h3 className="h4 text-p4">{value}</h3>
        </div>
        <div className="size-12 rounded-full border border-s4/25 flex items-center justify-center">
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatsCard; 