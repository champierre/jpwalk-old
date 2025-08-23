class WalkingSessionsController < ApplicationController
  before_action :set_walking_session, only: [ :show, :complete, :pause, :resume, :add_location, :destroy ]

  def index
    @walking_sessions = WalkingSession.order(started_at: :desc).limit(10)
    @current_session = WalkingSession.find_by(status: "active")
    @weekly_stats = calculate_weekly_stats
  end

  def show
    @location_points = @walking_session.location_points.ordered
  end

  def new
    @walking_session = WalkingSession.new
  end

  def create
    @walking_session = WalkingSession.new(
      started_at: Time.current,
      status: "active",
      total_distance: 0,
      total_steps: 0
    )

    if @walking_session.save
      redirect_to @walking_session
    else
      render :new, status: :unprocessable_entity
    end
  end

  def complete
    @walking_session.complete!
    @walking_session.update(total_distance: @walking_session.calculate_distance_from_points)
    redirect_to @walking_session, notice: "ウォーキングセッションを完了しました！"
  end

  def pause
    @walking_session.update(status: "paused")
    redirect_to @walking_session
  end

  def resume
    @walking_session.update(status: "active")
    redirect_to @walking_session
  end

  def add_location
    location_point = @walking_session.location_points.build(location_params)
    location_point.recorded_at = Time.current

    if location_point.save
      render json: { success: true, distance: @walking_session.calculate_distance_from_points }
    else
      render json: { success: false, errors: location_point.errors.full_messages }
    end
  end

  def current
    @walking_session = WalkingSession.find_by(status: [ "active", "paused" ])
    if @walking_session
      render json: {
        id: @walking_session.id,
        status: @walking_session.status,
        duration: @walking_session.duration,
        distance: @walking_session.calculate_distance_from_points
      }
    else
      render json: { active: false }
    end
  end

  def weekly_summary
    @weekly_stats = calculate_weekly_stats
    render json: @weekly_stats
  end

  def update
    # Not needed for now
  end

  def destroy
    @walking_session.destroy
    redirect_to root_path, notice: "セッションを削除しました。"
  end

  private

  def set_walking_session
    @walking_session = WalkingSession.find(params[:id])
  end

  def location_params
    params.require(:location_point).permit(:latitude, :longitude, :speed, :interval_type)
  end

  def calculate_weekly_stats
    sessions = WalkingSession.this_week.completed
    {
      total_sessions: sessions.count,
      total_distance: sessions.sum(&:calculate_distance_from_points),
      total_duration: sessions.sum(&:duration_in_minutes),
      days_completed: sessions.map { |s| s.started_at.to_date }.uniq.count,
      target_days: 4,
      target_met: sessions.count >= 4
    }
  end
end
