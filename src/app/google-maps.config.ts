import { EnvironmentProviders, importProvidersFrom } from '@angular/core';
import { AgmCoreModule } from '@agm/core';
import { environment } from '../environments/environment.prod';

export function provideGoogleMaps(): EnvironmentProviders {
  return importProvidersFrom(
    AgmCoreModule.forRoot({
      apiKey: environment.googleMapsApiKey,
      libraries: ['places']
    })
  );
}