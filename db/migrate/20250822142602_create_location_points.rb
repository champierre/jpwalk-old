class CreateLocationPoints < ActiveRecord::Migration[8.0]
  def change
    create_table :location_points do |t|
      t.references :walking_session, null: false, foreign_key: true
      t.float :latitude
      t.float :longitude
      t.datetime :recorded_at
      t.float :speed
      t.string :interval_type

      t.timestamps
    end
  end
end
