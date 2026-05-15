{{- define "taskflow.name" -}}
taskflow
{{- end }}

{{- define "taskflow.labels" -}}
app.kubernetes.io/name: {{ include "taskflow.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{- define "taskflow.apiImage" -}}
{{ .Values.global.imageRegistry }}/{{ .Values.global.imageOwner }}/{{ .Values.api.image.repository }}:{{ .Values.global.imageTag }}
{{- end }}

{{- define "taskflow.webImage" -}}
{{ .Values.global.imageRegistry }}/{{ .Values.global.imageOwner }}/{{ .Values.web.image.repository }}:{{ .Values.global.imageTag }}
{{- end }}
