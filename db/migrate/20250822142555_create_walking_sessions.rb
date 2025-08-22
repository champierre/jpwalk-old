class CreateWalkingSessions < ActiveRecord::Migration[8.0]
  def change
    create_table :walking_sessions do |t|
      t.datetime :started_at
      t.datetime :ended_at
      t.float :total_distance
      t.integer :total_steps
      t.string :status

      t.timestamps
    end
  end
end
