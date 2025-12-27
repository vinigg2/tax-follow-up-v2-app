import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft } from 'lucide-react';
import { useTask, useTaskTimeline } from '@/hooks/useTasks';
import { ScreenLoader } from '@/components/screen-loader';
import { Skeleton } from '@/components/ui/skeleton';

interface TaskDocument {
  id: number;
  name: string;
  status: string;
  is_obligatory: boolean;
}

interface TimelineEntry {
  id: number;
  type: string;
  description?: string;
  user_name?: string;
  created_at: string;
}

export default function TaskView() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: taskData, isLoading: taskLoading } = useTask(id);
  const { data: timelineData, isLoading: timelineLoading } = useTaskTimeline(id);

  if (taskLoading) return <ScreenLoader />;

  const task = taskData?.task;

  if (!task) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Tarefa nao encontrada.</p>
        <button
          onClick={() => navigate('/tasks')}
          className="btn-primary mt-4"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <button
        onClick={() => navigate('/tasks')}
        className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        Voltar para tarefas
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main info */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h1 className="text-xl font-bold text-gray-900">
                {task.task_hierarchy_title || task.title}
              </h1>
            </div>
            <div className="card-body">
              {task.description && (
                <p className="text-gray-600 mb-4">{task.description}</p>
              )}

              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Empresa</dt>
                  <dd className="text-sm text-gray-900">{task.company?.name}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Prazo</dt>
                  <dd className="text-sm text-gray-900">
                    {task.formatted_deadline}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900">{task.status}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Responsavel
                  </dt>
                  <dd className="text-sm text-gray-900">
                    {task.responsible_name || '-'}
                  </dd>
                </div>
                {task.competency && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">
                      Competencia
                    </dt>
                    <dd className="text-sm text-gray-900">{task.competency}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Documents */}
          <div className="card mt-6">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('tasks.documents')}
              </h2>
            </div>
            <div className="card-body">
              {task.documents && task.documents.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {task.documents.map((doc: TaskDocument) => (
                    <li
                      key={doc.id}
                      className="py-3 flex justify-between items-center"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {doc.name}
                        </p>
                        <p className="text-sm text-gray-500">{doc.status}</p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          doc.is_obligatory
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {doc.is_obligatory ? 'Obrigatorio' : 'Opcional'}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Nenhum documento.</p>
              )}
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">
                {t('tasks.timeline')}
              </h2>
            </div>
            <div className="card-body">
              {timelineLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : timelineData?.timeline && timelineData.timeline.length > 0 ? (
                <ul className="space-y-4">
                  {timelineData.timeline.map((entry: TimelineEntry) => (
                    <li key={entry.id} className="text-sm">
                      <p className="font-medium text-gray-900">
                        {entry.user_name || 'Sistema'}
                      </p>
                      <p className="text-gray-600">
                        {entry.description || entry.type}
                      </p>
                      <p className="text-gray-400 text-xs">
                        {new Date(entry.created_at).toLocaleString('pt-BR')}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Nenhum evento.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
