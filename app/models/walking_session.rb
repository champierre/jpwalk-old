class WalkingSession < ApplicationRecord
  has_many :location_points, dependent: :destroy
  
  validates :started_at, presence: true
  validates :status, inclusion: { in: %w[active paused completed cancelled] }
  
  scope :this_week, -> { where(started_at: Time.current.beginning_of_week..Time.current.end_of_week) }
  scope :completed, -> { where(status: 'completed') }
  
  def duration
    return 0 unless started_at && ended_at
    (ended_at - started_at).to_i
  end
  
  def duration_in_minutes
    duration / 60
  end
  
  def complete!
    update!(status: 'completed', ended_at: Time.current) if status == 'active'
  end
  
  def calculate_distance_from_points
    return 0 if location_points.size < 2
    
    total = 0
    location_points.order(:recorded_at).each_cons(2) do |point1, point2|
      total += haversine_distance(
        point1.latitude, point1.longitude,
        point2.latitude, point2.longitude
      )
    end
    total
  end
  
  private
  
  def haversine_distance(lat1, lon1, lat2, lon2)
    rad_per_deg = Math::PI / 180
    earth_radius_km = 6371
    
    dlat_rad = (lat2 - lat1) * rad_per_deg
    dlon_rad = (lon2 - lon1) * rad_per_deg
    
    lat1_rad = lat1 * rad_per_deg
    lat2_rad = lat2 * rad_per_deg
    
    a = Math.sin(dlat_rad / 2)**2 + Math.cos(lat1_rad) * Math.cos(lat2_rad) * Math.sin(dlon_rad / 2)**2
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    
    earth_radius_km * c
  end
end
