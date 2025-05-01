import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../loading.service';

let totalRequests = 0;

export const LoadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  const shouldSkip = req.headers.get('X-Skip-Loading') === 'true';

  if (!shouldSkip) {
    totalRequests++;
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!shouldSkip) {
        totalRequests--;
        if (totalRequests === 0) {
          loadingService.hide();
        }
      }
    })
  );
};
