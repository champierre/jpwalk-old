require "test_helper"

class WalkingSessionsControllerTest < ActionDispatch::IntegrationTest
  test "should destroy walking session" do
    session_to_delete = walking_sessions(:completed_session)

    assert_difference("WalkingSession.count", -1) do
      delete walking_session_path(session_to_delete)
    end

    assert_redirected_to root_path
    assert_equal "セッションを削除しました。", flash[:notice]
  end

  test "should destroy walking session with location points" do
    session_with_points = walking_sessions(:active_session)
    # Create some location points for this session
    session_with_points.location_points.create!(
      latitude: 35.6762,
      longitude: 139.6503,
      recorded_at: 30.minutes.ago,
      interval_type: "fast"
    )
    session_with_points.location_points.create!(
      latitude: 35.6762,
      longitude: 139.6504,
      recorded_at: 20.minutes.ago,
      interval_type: "slow"
    )

    # Count total location points for this session (includes fixture data)
    initial_count = session_with_points.location_points.count
    total_location_points = LocationPoint.count

    # Delete the session (should cascade delete location points)
    assert_difference("WalkingSession.count", -1) do
      assert_difference("LocationPoint.count", -initial_count) do
        delete walking_session_path(session_with_points)
      end
    end

    assert_redirected_to root_path
    assert_equal "セッションを削除しました。", flash[:notice]
  end

  test "should handle deletion of non-existent session" do
    delete walking_session_path(99999)
    assert_response :not_found
  end

  test "should redirect to root path after successful deletion" do
    session_to_delete = walking_sessions(:paused_session)

    delete walking_session_path(session_to_delete)

    assert_redirected_to root_path
    follow_redirect!
    assert_response :success
  end
end
