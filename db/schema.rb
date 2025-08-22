# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[8.0].define(version: 2025_08_22_142602) do
  create_table "location_points", force: :cascade do |t|
    t.integer "walking_session_id", null: false
    t.float "latitude"
    t.float "longitude"
    t.datetime "recorded_at"
    t.float "speed"
    t.string "interval_type"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["walking_session_id"], name: "index_location_points_on_walking_session_id"
  end

  create_table "walking_sessions", force: :cascade do |t|
    t.datetime "started_at"
    t.datetime "ended_at"
    t.float "total_distance"
    t.integer "total_steps"
    t.string "status"
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
  end

  add_foreign_key "location_points", "walking_sessions"
end
