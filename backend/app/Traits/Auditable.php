<?php

namespace App\Traits;

use App\Models\SystemAuditLog;

trait Auditable
{
    public static function bootAuditable()
    {
        static::created(function ($model) {
            SystemAuditLog::log(
                strtoupper(class_basename($model)),
                'CREATE',
                $model->getTable(),
                $model->getKey(),
                null,
                $model->getAttributes()
            );
        });

        static::updated(function ($model) {
            $changed = $model->getDirty();
            if (!empty($changed)) {
                $old = array_intersect_key($model->getOriginal(), $changed);
                SystemAuditLog::log(
                    strtoupper(class_basename($model)),
                    'UPDATE',
                    $model->getTable(),
                    $model->getKey(),
                    $old,
                    $changed
                );
            }
        });

        static::deleted(function ($model) {
            SystemAuditLog::log(
                strtoupper(class_basename($model)),
                'DELETE',
                $model->getTable(),
                $model->getKey(),
                $model->getOriginal(),
                null
            );
        });
    }
}
