import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';

export default function Profile() {
    const { t } = useTranslation();
    const { user } = useAuth();

    return (
        <div className="container-fluid">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                {t('nav.profile')}
            </h1>

            <div className="card">
                <div className="card-body">
                    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Nome</dt>
                            <dd className="mt-1 text-sm text-gray-900">{user?.name}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">E-mail</dt>
                            <dd className="mt-1 text-sm text-gray-900">{user?.email}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Usuario</dt>
                            <dd className="mt-1 text-sm text-gray-900">{user?.username}</dd>
                        </div>
                        <div>
                            <dt className="text-sm font-medium text-gray-500">Idioma</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                                {user?.language === 'pt' ? 'Portugues' : 'English'}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>
        </div>
    );
}
