class LocationPoint < ApplicationRecord
  belongs_to :walking_session

  validates :latitude, presence: true, numericality: { greater_than_or_equal_to: -90, less_than_or_equal_to: 90 }
  validates :longitude, presence: true, numericality: { greater_than_or_equal_to: -180, less_than_or_equal_to: 180 }
  validates :recorded_at, presence: true
  validates :interval_type, inclusion: { in: %w[fast slow pause] }

  scope :ordered, -> { order(:recorded_at) }
end
