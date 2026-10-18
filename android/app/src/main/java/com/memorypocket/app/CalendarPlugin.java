package com.memorypocket.app;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.provider.CalendarContract;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "PhoneCalendar")
public class CalendarPlugin extends Plugin {
    @PluginMethod
    public void openEvent(PluginCall call) {
        Long start = call.getLong("start");
        String title = call.getString("title");
        if (start == null || start <= 0 || title == null || title.trim().isEmpty()) {
            call.reject("일정 제목과 알림 시간이 필요합니다.");
            return;
        }

        Intent intent = new Intent(Intent.ACTION_INSERT)
            .setData(CalendarContract.Events.CONTENT_URI)
            .putExtra(CalendarContract.EXTRA_EVENT_BEGIN_TIME, start)
            .putExtra(CalendarContract.EXTRA_EVENT_END_TIME, start + 30 * 60 * 1000L)
            .putExtra(CalendarContract.Events.TITLE, title)
            .putExtra(CalendarContract.Events.DESCRIPTION, call.getString("description", ""))
            .putExtra(CalendarContract.Events.HAS_ALARM, 1);

        getActivity().runOnUiThread(() -> {
            try {
                getActivity().startActivity(intent);
                call.resolve();
            } catch (ActivityNotFoundException | SecurityException error) {
                call.reject("캘린더 앱을 열 수 없습니다. 캘린더 앱 설치 및 사용 설정을 확인해 주세요.", error);
            }
        });
    }
}
